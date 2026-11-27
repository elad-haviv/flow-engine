import type { Endpoint, Project } from "./schema/project";

/** Node key of a wire endpoint: a promoted junction resolves to its terminal. */
export function nodeKey(p: Project, e: Endpoint): string {
  if ("terminalId" in e) return e.terminalId;
  const j = p.junctions.find((x) => x.id === e.junctionId);
  return j?.terminalId ?? e.junctionId;
}

/** Connectivity classes (nets) as sorted lists of node keys, sorted. Derived, never stored. */
export function nets(p: Project): string[][] {
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    let r = parent.get(k) ?? k;
    if (r !== k) { r = find(r); parent.set(k, r); }
    return r;
  };
  for (const t of p.terminals) parent.set(t.id, t.id);
  for (const w of p.wires) {
    const a = nodeKey(p, w.from), b = nodeKey(p, w.to);
    if (!parent.has(a)) parent.set(a, a);
    if (!parent.has(b)) parent.set(b, b);
    parent.set(find(a), find(b));
  }
  const groups = new Map<string, string[]>();
  for (const k of parent.keys()) {
    const r = find(k);
    groups.set(r, [...(groups.get(r) ?? []), k]);
  }
  return [...groups.values()].map((g) => g.sort()).sort((x, y) => (x[0]! < y[0]! ? -1 : 1));
}
