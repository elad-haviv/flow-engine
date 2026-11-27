import { profiles } from "@flow/catalog";
import { diagnostic, type Cable, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import { wireImpedance } from "./cables";
import type { Graph, Island } from "./graph";
import { C, abs, add, conj, mul, scale, sub, type Complex } from "./numeric/complex";
import { num, type Dev } from "./params";
import type { BranchResult, LoadResult, NodeResult, SourceResult } from "./results";
import { solvePowerFlow, type PfBranch, type PfNode } from "./solvers/powerflow";
import { input, traced } from "./trace";

export const SBASE = 1e6;

export interface FlowOutput {
  nodes: NodeResult[];
  branches: BranchResult[];
  loads: LoadResult[];
  sources: SourceResult[];
  method: string;
  iterations: number;
  converged: boolean;
  /** Power each slack-side converter delivers, in watts, by device id */
  outputW: Map<string, number>;
  /** Node voltages in pu by node key */
  voltage: Map<string, Complex>;
}

interface PfBranchInfo extends PfBranch {
  id: string;
  kind: "wire" | "transformer";
  vb: number;
  rPu: number;
}

function slackDevs(g: Graph, isl: Island): Dev[] {
  const ours = (d: Dev) => d.term.out !== undefined && g.islandOf.get(g.rep(d.term.out)) === isl;
  const fixed = isl.devs.filter(
    (d) =>
      ours(d) &&
      ((d.def.category === "source" && d.def.sourceRole === "slack") ||
        (d.def.category === "converter" && d.def.outputSystem !== "loop")),
  );
  if (fixed.length) return fixed;
  const gen = isl.devs.find((d) => d.def.category === "source" && d.def.sourceRole === "pq");
  return gen ? [gen] : [];
}

export function solveFlow(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  converterInputW: Map<string, number>,
  profileId: "il" | "iec",
  diags: Diagnostic[],
): FlowOutput | undefined {
  const system = isl.system!;
  const index = new Map(isl.nodes.map((n, i) => [n, i]));
  const nodes: PfNode[] = isl.nodes.map(() => ({ slack: false, vSet: 1, s: C(0) }));
  const slacks = slackDevs(g, isl);
  const slackNode = new Map<number, Dev>();
  for (const d of slacks) {
    const node = g.rep(d.term.out!);
    const i = index.get(node)!;
    const param = d.def.terminalVoltage!.out!;
    nodes[i]!.slack = true;
    nodes[i]!.vSet = num(d, param) / base.get(node)!;
    if (!slackNode.has(i)) slackNode.set(i, d);
  }
  const inject = (node: string, p: number, q: number) => {
    const n = nodes[index.get(node)!]!;
    n.s = add(n.s, C(p / SBASE, system === "dc" ? 0 : q / SBASE));
  };
  for (const d of isl.devs) {
    if (d.def.category === "source" && d.def.sourceRole === "pq" && !slacks.includes(d) && d.term.out) {
      const s = d.def.supply!(d.p);
      inject(g.rep(d.term.out), s.p, s.q);
    }
    if (d.def.category === "load" && d.term.in) {
      const s = d.def.demand!(d.p, 0);
      inject(g.rep(d.term.in), -s.p, -s.q);
    }
    if (d.def.category === "converter" && d.term.in && g.islandOf.get(g.rep(d.term.in)) === isl) {
      const s = d.def.demand!(d.p, converterInputW.get(d.device.id) ?? 0);
      inject(g.rep(d.term.in), -s.p, -s.q);
    }
  }
  const infos: PfBranchInfo[] = [];
  for (const w of isl.wires) {
    const cable = g.project.cables.find((c) => c.id === w.wire.cableId) as Cable;
    const z = wireImpedance(cable, system, "operating");
    if (!z) {
      diags.push(diagnostic(ENGINE_CODES.cableNoConductor, "error", [cable.id]));
      return undefined;
    }
    const vb = base.get(w.a)!;
    const zb = (vb * vb) / SBASE;
    infos.push({
      from: index.get(w.a)!,
      to: index.get(w.b)!,
      z: scale(z.z, 1 / zb),
      id: w.wire.id,
      kind: "wire",
      vb,
      rPu: z.r / zb,
    });
  }
  for (const d of isl.devs) {
    if (d.def.category !== "transformer" || !d.def.seriesImpedance) continue;
    const t = d.def.seriesImpedance(d.p);
    const a = g.rep(d.term.in!),
      b = g.rep(d.term.out!);
    if (a === b) continue;
    const f = SBASE / t.ratedVA;
    infos.push({
      from: index.get(a)!,
      to: index.get(b)!,
      z: C(t.r * f, t.x * f),
      id: d.device.id,
      kind: "transformer",
      vb: base.get(a)!,
      rPu: t.r * f,
    });
  }
  let pf;
  try {
    pf = solvePowerFlow(nodes, infos);
  } catch {
    diags.push(diagnostic(ENGINE_CODES.loadflowNotConverged, "error", isl.nodes, { reason: "singular" }));
    return undefined;
  }
  if (!pf.converged)
    diags.push(diagnostic(ENGINE_CODES.loadflowNotConverged, "error", isl.nodes, { iterations: pf.iterations }));
  const ibase = (vb: number) => (system === "ac3" ? SBASE / (Math.sqrt(3) * vb) : SBASE / vb);
  const voltage = new Map(isl.nodes.map((n, i) => [n, pf.v[i]!]));
  const common = [input("Sbase", SBASE, "VA", "computed")];
  const out: FlowOutput = {
    nodes: [],
    branches: [],
    loads: [],
    sources: [],
    method: pf.method,
    iterations: pf.iterations,
    converged: pf.converged,
    outputW: new Map(),
    voltage,
  };
  isl.nodes.forEach((n, i) => {
    const v = pf.v[i]!;
    const vb = base.get(n)!;
    const q = (k: string) => `node:${n}.${k}`;
    const ins = [...common, input("Vbase", vb, "V", "entered")];
    out.nodes.push({
      key: n,
      terminals: g.project.terminals.filter((t) => g.rep(t.id) === n).map((t) => t.id),
      baseVoltage: traced(vb, "V", q("base"), "nominal voltage from source or transformer rating", [
        input("Vn", vb, "V"),
      ]),
      voltage: traced(abs(v) * vb, "V", q("voltage"), "|V| = |V_pu| * Vbase; V_pu from S = V * conj(Y V)", ins),
      voltagePu: traced(abs(v), "pu", q("voltagePu"), "solution of S = V * conj(Y V) per unit", ins),
      angle: traced((Math.atan2(v.im, v.re) * 180) / Math.PI, "deg", q("angle"), "arg(V_pu)", ins),
    });
  });
  for (const b of infos) {
    const dv = sub(pf.v[b.from]!, pf.v[b.to]!);
    const ipu = abs(dv) / abs(b.z);
    const a = ibase(b.vb) * ipu;
    out.branches.push({
      id: b.id,
      kind: b.kind,
      current: traced(a, "A", `branch:${b.id}.current`, "I = |V_from - V_to| / |Z| * Ibase", [
        ...common,
        input("Vbase", b.vb, "V"),
      ]),
      loss: traced(ipu * ipu * b.rPu * SBASE, "W", `branch:${b.id}.loss`, "P = I_pu^2 * R_pu * Sbase", [
        ...common,
        input("R_pu", b.rPu, "pu", "computed"),
      ]),
    });
  }
  const limit = profiles.rows[profileId].maxDropPercent;
  for (const d of isl.devs) {
    if (d.def.category !== "load" || !d.term.in) continue;
    const node = g.rep(d.term.in);
    const v = abs(voltage.get(node)!);
    const vb = base.get(node)!;
    const s = d.def.demand!(d.p, 0);
    const drop = (1 - v) * 100;
    const rated = d.p["voltage"];
    if (typeof rated === "number" && Math.abs(rated - vb) / vb > 0.1)
      diags.push(diagnostic(ENGINE_CODES.voltageRating, "warning", [d.device.id], { rated, network: vb }));
    const status = drop > limit ? "undervoltage" : "ok";
    if (status === "undervoltage")
      diags.push(
        diagnostic(ENGINE_CODES.voltageDrop, "warning", [d.device.id], { drop: Math.round(drop * 100) / 100, limit }),
      );
    const ins = [input("V", v * vb, "V", "computed"), input("Vn", vb, "V")];
    const origin = d.defaulted.length ? "default" : "entered";
    out.loads.push({
      deviceId: d.device.id,
      status,
      voltage: traced(v * vb, "V", `load:${d.device.id}.voltage`, "node voltage", ins),
      dropPercent: traced(
        drop,
        "%",
        `load:${d.device.id}.drop`,
        "(1 - |V_pu|) * 100",
        [...ins, input("limit", limit, "%", "standard")],
        { clause: "IEC 60364-5-52 annex G (limit is the drafter's assumption)" },
      ),
      activePower: traced(s.p, "W", `load:${d.device.id}.p`, "P from device parameters", [
        input("power", s.p, "W", origin),
      ]),
      reactivePower: traced(s.q, "var", `load:${d.device.id}.q`, "Q = P * tan(acos(pf))", [
        input("power", s.p, "W", origin),
      ]),
    });
  }
  const slackS = (i: number): Complex => {
    let cur = C(0);
    for (const b of infos) {
      if (b.from === i) cur = add(cur, mul(sub(pf.v[i]!, pf.v[b.to]!), invert(b.z)));
      if (b.to === i) cur = add(cur, mul(sub(pf.v[i]!, pf.v[b.from]!), invert(b.z)));
    }
    return add(scale(mul(pf.v[i]!, conj(cur)), SBASE), scale(nodes[i]!.s, -SBASE));
  };
  for (const [i, d] of slackNode) {
    const s = slackS(i);
    out.outputW.set(d.device.id, s.re);
    out.sources.push(sourceResult(d, s.re, s.im, common));
  }
  for (const d of isl.devs) {
    if (d.def.category === "source" && d.def.sourceRole === "pq" && !slacks.includes(d)) {
      const s = d.def.supply!(d.p);
      out.sources.push(sourceResult(d, s.p, s.q, common));
    }
  }
  return out;
}

const invert = (z: Complex): Complex => C(z.re / (z.re ** 2 + z.im ** 2), -z.im / (z.re ** 2 + z.im ** 2));

function sourceResult(d: Dev, p: number, q: number, ins: ReturnType<typeof input>[]): SourceResult {
  return {
    deviceId: d.device.id,
    activePower: traced(p, "W", `source:${d.device.id}.p`, "P = Re(V * conj(sum I)) * Sbase", ins),
    reactivePower: traced(q, "var", `source:${d.device.id}.q`, "Q = Im(V * conj(sum I)) * Sbase", ins),
  };
}
