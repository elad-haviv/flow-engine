import { profiles, type StandardTable } from "@flow/catalog";
import { diagnostic, type Diagnostic, type Project } from "@flow/model";
import { assignBase } from "./base";
import { adviseBusbars, checkBreaking, checkCables } from "./checks";
import { ENGINE_CODES } from "./codes";
import { solveFlow, type FlowOutput } from "./flow";
import { buildGraph, type Island } from "./graph";
import { solveLoop } from "./loop";
import { readDevices } from "./params";
import { emptyResults, type LoopResult, type Results } from "./results";
import { shortCircuit } from "./short-circuit";
import { input, traced } from "./trace";

export interface SolveOptions {
  profile: "il" | "iec";
}

const MAX_BOUNDARY = 20;
const DAMPING = 0.5;
const REL_TOL = 1e-6;
const ABS_TOL_W = 1e-3;

/** Pure and deterministic: the same project and options give the same results. */
export function solve(project: Project, options: SolveOptions): Results {
  const diags: Diagnostic[] = [];
  const devs = readDevices(project, diags);
  if (!devs) return emptyResults(options.profile, diags);
  const g = buildGraph(project, devs, diags);
  const res = emptyResults(options.profile, diags);
  if (diags.some((d) => d.severity === "error")) return res;
  adviseBusbars(g, diags);
  for (const d of devs)
    if (d.def.category === "earthing" && d.device.state === "grounded") {
      const node = g.rep(d.term.in!);
      const isl = g.islandOf.get(node);
      if (isl?.devs.some((x) => x.def.category === "source"))
        diags.push(diagnostic(ENGINE_CODES.earthedLive, "warning", [d.device.id]));
    }
  const live: Island[] = [];
  const bases = new Map<Island, Map<string, number>>();
  for (const isl of g.islands) {
    const hasSource = isl.devs.some(
      (d) =>
        (d.def.category === "source" && d.term.out) ||
        (d.def.category === "converter" && d.term.out && g.islandOf.get(g.rep(d.term.out)) === isl),
    );
    if (!isl.system || !hasSource) {
      if (isl.devs.length)
        diags.push(
          diagnostic(
            ENGINE_CODES.islandNoSource,
            "warning",
            isl.devs.map((d) => d.device.id),
          ),
        );
      continue;
    }
    if (isl.system === "loop") {
      live.push(isl);
      continue;
    }
    const base = assignBase(g, isl, diags);
    if (!base) continue;
    bases.set(isl, base);
    live.push(isl);
  }
  const converterOut = new Map<string, number>();
  const converterIn = new Map<string, number>();
  let flows = new Map<Island, { f: FlowOutput | undefined; d: Diagnostic[] }>();
  let loops = new Map<Island, { r: LoopResult | undefined; d: Diagnostic[] }>();
  let iterations = 0;
  let boundaryConverged = false;
  let damping = 1;
  let prevDelta = Infinity;
  for (let it = 1; it <= MAX_BOUNDARY; it++) {
    iterations = it;
    flows = new Map();
    loops = new Map();
    let delta = 0;
    converterOut.clear();
    for (const isl of live) {
      if (isl.system === "loop") {
        const d: Diagnostic[] = [];
        const lr = solveLoop(g, isl, d);
        loops.set(isl, { r: lr.result, d });
        lr.outputPowerW.forEach((w, id) => converterOut.set(id, w));
        continue;
      }
      const d: Diagnostic[] = [];
      const f = solveFlow(g, isl, bases.get(isl)!, converterIn, options.profile, d);
      flows.set(isl, { f, d });
      if (!f) continue;
      f.outputW.forEach((w, id) => {
        if (!converterOut.has(id)) converterOut.set(id, w);
      });
    }
    for (const [id, target] of converterOut) {
      const old = converterIn.get(id) ?? 0;
      const next = old + damping * (target - old);
      delta = Math.max(delta, Math.abs(next - old));
      converterIn.set(id, next);
    }
    const scale = Math.max(0, ...[...converterOut.values()].map(Math.abs));
    if (delta <= ABS_TOL_W + REL_TOL * scale) {
      boundaryConverged = true;
      break;
    }
    if (it > 2 && delta > 0.9 * prevDelta) damping = DAMPING;
    prevDelta = delta;
  }
  if (!boundaryConverged) diags.push(diagnostic(ENGINE_CODES.boundaryNotConverged, "error", [], { iterations }));
  const used = new Set<StandardTable<unknown>>();
  for (const isl of live) {
    if (isl.system === "loop") {
      const lo = loops.get(isl)!;
      diags.push(...lo.d);
      const r = lo.r;
      if (r) res.loops.push(r);
      res.islands.push({
        id: isl.id,
        system: "loop",
        method: "series sum",
        iterations: traced(1, "count", `${isl.id}.iterations`, "one pass", [input("passes", 1, "count", "computed")]),
        converged: !!r,
      });
      continue;
    }
    const fl = flows.get(isl)!;
    diags.push(...fl.d);
    const f = fl.f;
    if (!f) continue;
    res.nodes.push(...f.nodes);
    res.branches.push(...f.branches);
    res.loads.push(...f.loads);
    res.sources.push(...f.sources);
    res.islands.push({
      id: isl.id,
      system: isl.system!,
      method: f.method,
      iterations: traced(f.iterations, "count", `${isl.id}.iterations`, "solver iterations", [
        input("method", f.method, "text", "computed"),
      ]),
      converged: f.converged,
    });
    const faults = shortCircuit(g, isl, bases.get(isl)!, options.profile, diags);
    res.faults.push(...faults);
    res.cableChecks.push(...checkCables(g, isl, f.branches, faults, used, diags));
    checkBreaking(g, isl, faults, diags);
  }
  if (res.cableChecks.length || res.faults.length) {
    diags.push(
      diagnostic(ENGINE_CODES.unverified, "info", [], { tables: [profiles.id, "conductors", "ampacity"].join(", ") }),
    );
  }
  return res;
}
