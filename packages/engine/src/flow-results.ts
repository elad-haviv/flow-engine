import { diagnostic, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import { SBASE, type PfModel } from "./flow-model";
import type { Graph, Island } from "./graph";
import { abs, sub, type Complex } from "./numeric/complex";
import type { Dev } from "./params";
import type { BranchResult, LoadResult, NodeResult, SourceResult } from "./results";
import type { PfResult } from "./solvers/powerflow";
import { input, traced, type TraceInput } from "./trace";

export function nodeResults(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  pf: PfResult,
  common: TraceInput[],
): NodeResult[] {
  return isl.nodes.map((n, i) => {
    const v = pf.v[i]!;
    const vb = base.get(n)!;
    const q = (k: string) => `node:${n}.${k}`;
    const ins = [...common, input("Vbase", vb, "V", "entered")];
    return {
      key: n,
      terminals: g.project.terminals.filter((t) => g.rep(t.id) === n).map((t) => t.id),
      baseVoltage: traced(vb, "V", q("base"), "nominal voltage from source or transformer rating", [
        input("Vn", vb, "V"),
      ]),
      voltage: traced(abs(v) * vb, "V", q("voltage"), "|V| = |V_pu| * Vbase; V_pu from S = V * conj(Y V)", ins),
      voltagePu: traced(abs(v), "pu", q("voltagePu"), "solution of S = V * conj(Y V) per unit", ins),
      angle: traced((Math.atan2(v.im, v.re) * 180) / Math.PI, "deg", q("angle"), "arg(V_pu)", ins),
    };
  });
}

export function branchResults(m: PfModel, pf: PfResult, system: string, common: TraceInput[]): BranchResult[] {
  return m.infos.map((b) => {
    const ipu = abs(sub(pf.v[b.from]!, pf.v[b.to]!)) / abs(b.z);
    const ibase = system === "ac3" ? SBASE / (Math.sqrt(3) * b.vb) : SBASE / b.vb;
    return {
      id: b.id,
      kind: b.kind,
      current: traced(ibase * ipu, "A", `branch:${b.id}.current`, "I = |V_from - V_to| / |Z| * Ibase", [
        ...common,
        input("Vbase", b.vb, "V"),
      ]),
      loss: traced(ipu * ipu * b.rPu * SBASE, "W", `branch:${b.id}.loss`, "P = I_pu^2 * R_pu * Sbase", [
        ...common,
        input("R_pu", b.rPu, "pu", "computed"),
      ]),
    };
  });
}

function loadOf(d: Dev, v: number, vb: number, limit: number): LoadResult {
  const s = d.def.demand!(d.p, 0);
  const drop = (1 - v) * 100;
  const ins = [input("V", v * vb, "V", "computed"), input("Vn", vb, "V")];
  const origin = d.defaulted.length ? "default" : "entered";
  const id = d.device.id;
  return {
    deviceId: id,
    status: drop > limit ? "undervoltage" : "ok",
    voltage: traced(v * vb, "V", `load:${id}.voltage`, "node voltage", ins),
    dropPercent: traced(
      drop,
      "%",
      `load:${id}.drop`,
      "(1 - |V_pu|) * 100",
      [...ins, input("limit", limit, "%", "standard")],
      {
        clause: "IEC 60364-5-52 annex G (limit is the drafter's assumption)",
      },
    ),
    activePower: traced(s.p, "W", `load:${id}.p`, "P from device parameters", [input("power", s.p, "W", origin)]),
    reactivePower: traced(s.q, "var", `load:${id}.q`, "Q = P * tan(acos(pf))", [input("power", s.p, "W", origin)]),
  };
}

export function loadResults(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  voltage: Map<string, Complex>,
  limit: number,
  diags: Diagnostic[],
): LoadResult[] {
  const out: LoadResult[] = [];
  for (const d of isl.devs) {
    if (d.def.category !== "load" || !d.term.in) continue;
    const node = g.rep(d.term.in);
    const vb = base.get(node)!;
    const r = loadOf(d, abs(voltage.get(node)!), vb, limit);
    const rated = d.p["voltage"];
    if (typeof rated === "number" && Math.abs(rated - vb) / vb > 0.1)
      diags.push(diagnostic(ENGINE_CODES.voltageRating, "warning", [d.device.id], { rated, network: vb }));
    if (r.status === "undervoltage")
      diags.push(
        diagnostic(ENGINE_CODES.voltageDrop, "warning", [d.device.id], {
          drop: Math.round(r.dropPercent.value * 100) / 100,
          limit,
        }),
      );
    out.push(r);
  }
  return out;
}

export function sourceResults(d: Dev, p: number, q: number, ins: TraceInput[]): SourceResult {
  return {
    deviceId: d.device.id,
    activePower: traced(p, "W", `source:${d.device.id}.p`, "P = Re(V * conj(sum I)) * Sbase", ins),
    reactivePower: traced(q, "var", `source:${d.device.id}.q`, "Q = Im(V * conj(sum I)) * Sbase", ins),
  };
}
