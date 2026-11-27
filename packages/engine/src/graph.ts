import type { PowerSystem } from "@flow/catalog";
import { diagnostic, nodeKey, type Diagnostic, type Project, type Wire } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import type { Dev } from "./params";

export interface WireInfo {
  wire: Wire;
  a: string;
  b: string;
  lengthM: number;
}
export interface Island {
  id: string;
  nodes: string[];
  system: PowerSystem | undefined;
  wires: WireInfo[];
  devs: Dev[];
}
export interface Graph {
  project: Project;
  devs: Dev[];
  byDevice: Map<string, Dev>;
  byTerminal: Map<string, Dev>;
  rep: (key: string) => string;
  wires: WireInfo[];
  islands: Island[];
  islandOf: Map<string, Island>;
}

class UnionFind {
  private parent = new Map<string, string>();
  find(k: string): string {
    const p = this.parent.get(k);
    if (p === undefined) {
      this.parent.set(k, k);
      return k;
    }
    if (p === k) return k;
    const r = this.find(p);
    this.parent.set(k, r);
    return r;
  }
  union(a: string, b: string): void {
    this.parent.set(this.find(a), this.find(b));
  }
}

const isClosed = (d: Dev): boolean => d.device.state !== "open";

/** Systems a device contributes to the island it sits in. */
function contributions(d: Dev, nodeIsOut: boolean): PowerSystem[] {
  const c = d.def.category;
  if (c === "series") return ["loop"];
  if (c === "converter") {
    if (!nodeIsOut) return [];
    const param = d.def.outputSystemParam;
    return [(d.def.outputSystem ?? (param ? d.p[param] : undefined)) as PowerSystem];
  }
  if (c === "source") return [(typeof d.p["system"] === "string" ? d.p["system"] : d.def.systems[0]) as PowerSystem];
  return typeof d.p["system"] === "string" ? [d.p["system"] as PowerSystem] : [];
}

function mergeSwitches(devs: Dev[], zero: UnionFind, diags: Diagnostic[]): void {
  for (const d of devs) {
    const { in: a, out: b } = d.term;
    if (d.def.category !== "switch" || !a || !b) continue;
    if (d.device.state === undefined && d.def.states)
      diags.push(diagnostic(ENGINE_CODES.stateAssumed, "info", [d.device.id]));
    if (isClosed(d)) zero.union(a, b);
  }
}

function mergeZeroImpedance(project: Project, devs: Dev[], diags: Diagnostic[]): UnionFind {
  const zero = new UnionFind();
  mergeSwitches(devs, zero, diags);
  const lens = new Map(project.cables.map((c) => [c.id, c.lengthM]));
  for (const w of project.wires)
    if ((lens.get(w.cableId) ?? 0) === 0) zero.union(nodeKey(project, w.from), nodeKey(project, w.to));
  for (const j of project.junctions) if (j.terminalId) zero.union(j.id, j.terminalId);
  return zero;
}

function linkNodes(devs: Dev[], wires: WireInfo[], rep: (k: string) => string): UnionFind {
  const link = new UnionFind();
  for (const w of wires) link.union(w.a, w.b);
  for (const d of devs) {
    const joins = d.def.category === "transformer" || d.def.category === "series";
    if (joins && d.term.in && d.term.out) link.union(rep(d.term.in), rep(d.term.out));
  }
  return link;
}

function groupIslands(project: Project, devs: Dev[], wires: WireInfo[], rep: (k: string) => string) {
  const link = linkNodes(devs, wires, rep);
  const islands = new Map<string, Island>();
  const islandOf = new Map<string, Island>();
  const get = (node: string): Island => {
    const r = link.find(node);
    let i = islands.get(r);
    if (!i) {
      i = { id: `island:${islands.size + 1}`, nodes: [], system: undefined, wires: [], devs: [] };
      islands.set(r, i);
    }
    islandOf.set(node, i);
    return i;
  };
  for (const t of project.terminals) {
    const i = get(rep(t.id));
    if (!i.nodes.includes(rep(t.id))) i.nodes.push(rep(t.id));
  }
  for (const w of wires) if (w.a !== w.b) get(w.a).wires.push(w);
  for (const d of devs)
    for (const tid of Object.values(d.term)) {
      const i = get(rep(tid));
      if (!i.devs.includes(d)) i.devs.push(d);
    }
  return { list: [...islands.values()], islandOf };
}

function classifyIsland(
  isl: Island,
  islandOf: Map<string, Island>,
  rep: (k: string) => string,
  diags: Diagnostic[],
): void {
  const found = new Set<PowerSystem>();
  for (const d of isl.devs)
    for (const [role, tid] of Object.entries(d.term))
      if (islandOf.get(rep(tid)) === isl) contributions(d, role === "out").forEach((s) => found.add(s));
  if (found.size > 1) {
    const ids = isl.devs.map((d) => d.device.id);
    diags.push(diagnostic(ENGINE_CODES.islandMixed, "error", ids, { systems: [...found].join(", ") }));
  }
  isl.system = found.size === 1 ? [...found][0] : undefined;
  if (isl.system && isl.system !== "loop") checkConverterInputs(isl, isl.system, islandOf, rep, diags);
}

function checkConverterInputs(
  isl: Island,
  system: PowerSystem,
  islandOf: Map<string, Island>,
  rep: (k: string) => string,
  diags: Diagnostic[],
): void {
  for (const d of isl.devs) {
    const fedHere = d.term.in !== undefined && islandOf.get(rep(d.term.in)) === isl;
    if (d.def.category === "converter" && fedHere && !d.def.systems.includes(system))
      diags.push(diagnostic(ENGINE_CODES.converterInput, "error", [d.device.id], { system }));
  }
}

export function buildGraph(project: Project, devs: Dev[], diags: Diagnostic[]): Graph {
  const byDevice = new Map(devs.map((d) => [d.device.id, d]));
  const byTerminal = new Map<string, Dev>();
  for (const d of devs) for (const t of Object.values(d.term)) byTerminal.set(t, d);
  const zero = mergeZeroImpedance(project, devs, diags);
  const rep = (k: string) => zero.find(k);
  const lens = new Map(project.cables.map((c) => [c.id, c.lengthM]));
  const wires: WireInfo[] = project.wires.map((wire) => ({
    wire,
    a: rep(nodeKey(project, wire.from)),
    b: rep(nodeKey(project, wire.to)),
    lengthM: lens.get(wire.cableId) ?? 0,
  }));
  const { list, islandOf } = groupIslands(project, devs, wires, rep);
  for (const isl of list) classifyIsland(isl, islandOf, rep, diags);
  return { project, devs, byDevice, byTerminal, rep, wires, islands: list, islandOf };
}
