import { diagnostic, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import { wireImpedance } from "./cables";
import type { Graph, Island } from "./graph";
import { num } from "./params";
import type { LoopResult } from "./results";
import { input, traced } from "./trace";

interface Edge {
  a: string;
  b: string;
  volts: number;
  ref: string;
}

/** Series constant-current loop: the regulator holds the current; the voltage it needs is the sum of the drops around the loop. */
export function solveLoop(
  g: Graph,
  isl: Island,
  diags: Diagnostic[],
): { result?: LoopResult; outputPowerW: Map<string, number> } {
  const reg = isl.devs.find((d) => d.def.category === "converter" && d.def.outputSystem === "loop");
  const out = new Map<string, number>();
  if (!reg || !reg.term.out || !reg.term.return) return { outputPowerW: out };
  const i = num(reg, "current");
  const edges: Edge[] = [];
  for (const w of isl.wires) {
    const z = wireImpedance(
      g.project.cables.find((c) => c.id === w.wire.cableId)!,
      "loop",
      "operating",
    );
    if (!z) {
      diags.push(diagnostic(ENGINE_CODES.cableNoConductor, "error", [w.wire.cableId]));
      continue;
    }
    edges.push({ a: w.a, b: w.b, volts: i * z.r, ref: w.wire.id });
  }
  const series = isl.devs.filter((d) => d.def.category === "series");
  for (const s of series)
    edges.push({ a: g.rep(s.term.in!), b: g.rep(s.term.out!), volts: num(s, "voltage"), ref: s.device.id });
  const start = g.rep(reg.term.out);
  const goal = g.rep(reg.term.return);
  const path = findPath(edges, start, goal);
  if (!path) {
    diags.push(diagnostic(ENGINE_CODES.loopOpen, "error", [reg.device.id]));
    return { outputPowerW: out };
  }
  const onPath = new Set(path.map((e) => e.ref));
  const stray = series.filter((s) => !onPath.has(s.device.id));
  if (stray.length)
    diags.push(
      diagnostic(
        ENGINE_CODES.loopBranching,
        "warning",
        stray.map((s) => s.device.id),
      ),
    );
  const v = path.reduce((s, e) => s + e.volts, 0);
  const max = num(reg, "maxVoltage");
  if (v > max)
    diags.push(diagnostic(ENGINE_CODES.loopCompliance, "error", [reg.device.id], { required: Math.round(v), max }));
  const eta = num(reg, "efficiency");
  out.set(reg.device.id, v * i);
  const origin = reg.defaulted.includes("efficiency") ? "default" : "entered";
  return {
    outputPowerW: out,
    result: {
      regulatorId: reg.device.id,
      current: traced(i, "A", `loop:${reg.device.id}.current`, "I = regulator setpoint", [input("current", i, "A")]),
      voltage: traced(v, "V", `loop:${reg.device.id}.voltage`, "U = sum(U_series loads) + I * sum(R_cable)", [
        input("current", i, "A"),
        input("seriesLoads", series.length, "count", "computed"),
      ]),
      power: traced(v * i, "W", `loop:${reg.device.id}.power`, "P = U * I", [
        input("U", v, "V", "computed"),
        input("I", i, "A"),
        input("efficiency", eta, "ratio", origin),
      ]),
      maxVoltage: traced(max, "V", `loop:${reg.device.id}.maxVoltage`, "regulator compliance voltage", [
        input("maxVoltage", max, "V"),
      ]),
    },
  };
}

function findPath(edges: Edge[], start: string, goal: string): Edge[] | undefined {
  const adj = new Map<string, Edge[]>();
  for (const e of edges) {
    (adj.get(e.a) ?? adj.set(e.a, []).get(e.a)!).push(e);
    (adj.get(e.b) ?? adj.set(e.b, []).get(e.b)!).push(e);
  }
  const seen = new Set<string>([start]);
  const dfs = (node: string): Edge[] | undefined => {
    if (node === goal) return [];
    for (const e of adj.get(node) ?? []) {
      const next = e.a === node ? e.b : e.a;
      if (seen.has(next)) continue;
      seen.add(next);
      const rest = dfs(next);
      if (rest) return [e, ...rest];
    }
    return undefined;
  };
  return start === goal ? [] : dfs(start);
}
