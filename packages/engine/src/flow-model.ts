import { diagnostic, type Cable, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import { wireImpedance } from "./cables";
import type { Graph, Island } from "./graph";
import { C, add, scale } from "./numeric/complex";
import { num, type Dev } from "./params";
import type { PfBranch, PfNode } from "./solvers/powerflow";

export const SBASE = 1e6;

interface PfBranchInfo extends PfBranch {
  id: string;
  kind: "wire" | "transformer";
  vb: number;
  rPu: number;
}

export interface PfModel {
  index: Map<string, number>;
  nodes: PfNode[];
  infos: PfBranchInfo[];
  slacks: Dev[];
  slackNode: Map<number, Dev>;
}

const isConverterOutputHere = (g: Graph, isl: Island, d: Dev): boolean =>
  d.def.category === "converter" &&
  d.def.outputSystem !== "loop" &&
  d.term.out !== undefined &&
  g.islandOf.get(g.rep(d.term.out)) === isl;

function slackDevs(g: Graph, isl: Island): Dev[] {
  const fixed = isl.devs.filter(
    (d) => (d.def.category === "source" && d.def.sourceRole === "slack") || isConverterOutputHere(g, isl, d),
  );
  if (fixed.length) return fixed;
  const gen = isl.devs.find((d) => d.def.category === "source" && d.def.sourceRole === "pq");
  return gen ? [gen] : [];
}

function setSlacks(g: Graph, base: Map<string, number>, m: PfModel): void {
  for (const d of m.slacks) {
    const node = g.rep(d.term.out!);
    const i = m.index.get(node)!;
    m.nodes[i]!.slack = true;
    m.nodes[i]!.vSet = num(d, d.def.terminalVoltage!.out!) / base.get(node)!;
    if (!m.slackNode.has(i)) m.slackNode.set(i, d);
  }
}

function injectDevices(g: Graph, isl: Island, converterInputW: Map<string, number>, m: PfModel): void {
  const system = isl.system;
  const inject = (node: string, p: number, q: number) => {
    const n = m.nodes[m.index.get(node)!]!;
    n.s = add(n.s, C(p / SBASE, system === "dc" ? 0 : q / SBASE));
  };
  for (const d of isl.devs) {
    const cat = d.def.category;
    if (cat === "source" && d.def.sourceRole === "pq" && !m.slacks.includes(d) && d.term.out) {
      const s = d.def.supply!(d.p);
      inject(g.rep(d.term.out), s.p, s.q);
    }
    if (cat === "load" && d.term.in) {
      const s = d.def.demand!(d.p, 0);
      inject(g.rep(d.term.in), -s.p, -s.q);
    }
    if (cat === "converter" && d.term.in && g.islandOf.get(g.rep(d.term.in)) === isl) {
      const s = d.def.demand!(d.p, converterInputW.get(d.device.id) ?? 0);
      inject(g.rep(d.term.in), -s.p, -s.q);
    }
  }
}

function wireBranches(g: Graph, isl: Island, base: Map<string, number>, m: PfModel, diags: Diagnostic[]): boolean {
  for (const w of isl.wires) {
    const cable = g.project.cables.find((c) => c.id === w.wire.cableId) as Cable;
    const z = wireImpedance(cable, isl.system!, "operating");
    if (!z) {
      diags.push(diagnostic(ENGINE_CODES.cableNoConductor, "error", [cable.id]));
      return false;
    }
    const vb = base.get(w.a)!;
    const zb = (vb * vb) / SBASE;
    m.infos.push({
      from: m.index.get(w.a)!,
      to: m.index.get(w.b)!,
      z: scale(z.z, 1 / zb),
      id: w.wire.id,
      kind: "wire",
      vb,
      rPu: z.r / zb,
    });
  }
  return true;
}

function transformerBranches(g: Graph, isl: Island, base: Map<string, number>, m: PfModel): void {
  for (const d of isl.devs) {
    if (d.def.category !== "transformer" || !d.def.seriesImpedance) continue;
    const t = d.def.seriesImpedance(d.p);
    const a = g.rep(d.term.in!);
    const b = g.rep(d.term.out!);
    if (a === b) continue;
    const f = SBASE / t.ratedVA;
    m.infos.push({
      from: m.index.get(a)!,
      to: m.index.get(b)!,
      z: C(t.r * f, t.x * f),
      id: d.device.id,
      kind: "transformer",
      vb: base.get(a)!,
      rPu: t.r * f,
    });
  }
}

/** Per-unit network of one island on a 1 MVA base. */
export function buildPfModel(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  converterInputW: Map<string, number>,
  diags: Diagnostic[],
): PfModel | undefined {
  const m: PfModel = {
    index: new Map(isl.nodes.map((n, i) => [n, i])),
    nodes: isl.nodes.map(() => ({ slack: false, vSet: 1, s: C(0) })),
    infos: [],
    slacks: slackDevs(g, isl),
    slackNode: new Map(),
  };
  setSlacks(g, base, m);
  injectDevices(g, isl, converterInputW, m);
  if (!wireBranches(g, isl, base, m, diags)) return undefined;
  transformerBranches(g, isl, base, m);
  return m;
}
