import { profiles } from "@flow/catalog";
import { diagnostic, type Diagnostic, type Project } from "@flow/model";
import { assignBase } from "./base";
import { adviseBusbars, checkBreaking, checkCables } from "./checks";
import { ENGINE_CODES } from "./codes";
import { solveFlow, type FlowOutput } from "./flow";
import { buildGraph, type Graph, type Island } from "./graph";
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

type FlowPass = Map<Island, { f: FlowOutput | undefined; d: Diagnostic[] }>;
type LoopPass = Map<Island, { r: LoopResult | undefined; d: Diagnostic[] }>;

function warnEarthedLive(g: Graph, diags: Diagnostic[]): void {
  for (const d of g.devs) {
    if (d.def.category !== "earthing" || d.device.state !== "grounded") continue;
    const isl = g.islandOf.get(g.rep(d.term.in!));
    if (isl?.devs.some((x) => x.def.category === "source"))
      diags.push(diagnostic(ENGINE_CODES.earthedLive, "warning", [d.device.id]));
  }
}

function hasSource(g: Graph, isl: Island): boolean {
  return isl.devs.some((d) => {
    if (!d.term.out) return false;
    const isSource = d.def.category === "source" || d.def.category === "converter";
    return isSource && (d.def.category === "source" || g.islandOf.get(g.rep(d.term.out)) === isl);
  });
}

/** Islands that can be calculated, with their nominal voltages. Others are reported and skipped. */
function liveIslands(g: Graph, diags: Diagnostic[]): { live: Island[]; bases: Map<Island, Map<string, number>> } {
  const live: Island[] = [];
  const bases = new Map<Island, Map<string, number>>();
  for (const isl of g.islands) {
    if (!isl.system || !hasSource(g, isl)) {
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
    if (isl.system !== "loop") {
      const base = assignBase(g, isl, diags);
      if (!base) continue;
      bases.set(isl, base);
    }
    live.push(isl);
  }
  return { live, bases };
}

/** One pass over all islands with the converter input powers fixed. */
function pass(
  g: Graph,
  live: Island[],
  bases: Map<Island, Map<string, number>>,
  inW: Map<string, number>,
  profile: "il" | "iec",
) {
  const flows: FlowPass = new Map();
  const loops: LoopPass = new Map();
  const outW = new Map<string, number>();
  for (const isl of live) {
    const d: Diagnostic[] = [];
    if (isl.system === "loop") {
      const lr = solveLoop(g, isl, d);
      loops.set(isl, { r: lr.result, d });
      lr.outputPowerW.forEach((w, id) => outW.set(id, w));
      continue;
    }
    const f = solveFlow(g, isl, bases.get(isl)!, inW, profile, d);
    flows.set(isl, { f, d });
    f?.outputW.forEach((w, id) => {
      if (!outW.has(id)) outW.set(id, w);
    });
  }
  return { flows, loops, outW };
}

/** Gauss-Seidel over the converter boundaries: full steps first, damped if the change stops shrinking. */
function iterateBoundaries(g: Graph, live: Island[], bases: Map<Island, Map<string, number>>, profile: "il" | "iec") {
  const inW = new Map<string, number>();
  let damping = 1;
  let prevDelta = Infinity;
  let last = { flows: new Map() as FlowPass, loops: new Map() as LoopPass, outW: new Map<string, number>() };
  for (let it = 1; it <= MAX_BOUNDARY; it++) {
    last = pass(g, live, bases, inW, profile);
    let delta = 0;
    for (const [id, target] of last.outW) {
      const old = inW.get(id) ?? 0;
      const next = old + damping * (target - old);
      delta = Math.max(delta, Math.abs(next - old));
      inW.set(id, next);
    }
    const scale = Math.max(0, ...[...last.outW.values()].map(Math.abs));
    if (delta <= ABS_TOL_W + REL_TOL * scale) return { ...last, converged: true, iterations: it };
    if (it > 2 && delta > 0.9 * prevDelta) damping = DAMPING;
    prevDelta = delta;
  }
  return { ...last, converged: false, iterations: MAX_BOUNDARY };
}

function addLoop(res: Results, isl: Island, lo: { r: LoopResult | undefined; d: Diagnostic[] }): void {
  if (lo.r) res.loops.push(lo.r);
  res.islands.push({
    id: isl.id,
    system: "loop",
    method: "series sum",
    iterations: traced(1, "count", `${isl.id}.iterations`, "one pass", [input("passes", 1, "count", "computed")]),
    converged: !!lo.r,
  });
}

function addFlow(
  res: Results,
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  f: FlowOutput,
  profile: "il" | "iec",
  diags: Diagnostic[],
): void {
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
  const faults = shortCircuit(g, isl, base, profile, diags);
  res.faults.push(...faults);
  res.cableChecks.push(...checkCables(g, isl, f.branches, faults, diags));
  checkBreaking(g, isl, faults, diags);
}

function assemble(
  res: Results,
  g: Graph,
  live: Island[],
  bases: Map<Island, Map<string, number>>,
  done: { flows: FlowPass; loops: LoopPass },
  profile: "il" | "iec",
  diags: Diagnostic[],
): void {
  for (const isl of live) {
    const lo = done.loops.get(isl);
    const fl = done.flows.get(isl);
    diags.push(...(lo?.d ?? fl?.d ?? []));
    if (lo) addLoop(res, isl, lo);
    else if (fl?.f) addFlow(res, g, isl, bases.get(isl)!, fl.f, profile, diags);
  }
}

/** Pure and deterministic: the same project and options give the same results. */
export function solve(project: Project, options: SolveOptions): Results {
  const diags: Diagnostic[] = [];
  const devs = readDevices(project, diags);
  if (!devs) return emptyResults(options.profile, diags);
  const g = buildGraph(project, devs, diags);
  const res = emptyResults(options.profile, diags);
  if (diags.some((d) => d.severity === "error")) return res;
  adviseBusbars(g, diags);
  warnEarthedLive(g, diags);
  const { live, bases } = liveIslands(g, diags);
  const done = iterateBoundaries(g, live, bases, options.profile);
  if (!done.converged)
    diags.push(diagnostic(ENGINE_CODES.boundaryNotConverged, "error", [], { iterations: done.iterations }));
  assemble(res, g, live, bases, done, options.profile, diags);
  if (res.cableChecks.some((c) => c.iz)) diags.push(diagnostic(ENGINE_CODES.assumption, "info", []));
  if (res.cableChecks.length || res.faults.length) {
    diags.push(
      diagnostic(ENGINE_CODES.unverified, "info", [], { tables: [profiles.id, "conductors", "ampacity"].join(", ") }),
    );
  }
  return res;
}
