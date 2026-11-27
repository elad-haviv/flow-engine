import type { TerminalRole } from "@flow/catalog";
import { diagnostic, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import type { Graph, Island } from "./graph";
import { num } from "./params";

const same = (a: number, b: number): boolean => Math.abs(a - b) <= 0.1 * Math.max(a, b);

/**
 * Nominal voltage of every node. Nodes joined by wires share one nominal voltage; transformer sides fix it.
 * Explicit voltages within 10 percent of each other belong to the same network (for example two DC sources at 48 V and 50 V).
 */
export function assignBase(g: Graph, isl: Island, diags: Diagnostic[]): Map<string, number> | undefined {
  const adj = new Map<string, string[]>();
  for (const w of isl.wires) {
    (adj.get(w.a) ?? adj.set(w.a, []).get(w.a)!).push(w.b);
    (adj.get(w.b) ?? adj.set(w.b, []).get(w.b)!).push(w.a);
  }
  const explicit = new Map<string, number[]>();
  for (const d of isl.devs) {
    for (const [role, tid] of Object.entries(d.term)) {
      const param = d.def.terminalVoltage?.[role as TerminalRole];
      const node = g.rep(tid);
      if (!param || g.islandOf.get(node) !== isl) continue;
      explicit.set(node, [...(explicit.get(node) ?? []), num(d, param)]);
    }
  }
  const base = new Map<string, number>();
  for (const start of isl.nodes) {
    if (base.has(start)) continue;
    const comp = [start];
    const seen = new Set(comp);
    for (let k = 0; k < comp.length; k++)
      for (const nx of adj.get(comp[k]!) ?? [])
        if (!seen.has(nx)) {
          seen.add(nx);
          comp.push(nx);
        }
    const values = comp.flatMap((n) => explicit.get(n) ?? []);
    if (!values.length) continue;
    const first = values[0]!;
    const bad = values.find((v) => !same(first, v));
    if (bad !== undefined) {
      diags.push(diagnostic(ENGINE_CODES.voltageConflict, "error", comp, { a: first, b: bad }));
      return undefined;
    }
    comp.forEach((n) => base.set(n, first));
  }
  const missing = isl.nodes.filter((n) => !base.has(n));
  if (missing.length) {
    diags.push(diagnostic(ENGINE_CODES.voltageUnknown, "error", missing));
    return undefined;
  }
  return base;
}
