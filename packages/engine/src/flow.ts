import { profiles } from "@flow/catalog";
import { diagnostic, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import { SBASE, buildPfModel, type PfModel } from "./flow-model";
import { branchResults, loadResults, nodeResults, sourceResults } from "./flow-results";
import type { Graph, Island } from "./graph";
import { C, add, conj, mul, scale, sub, type Complex } from "./numeric/complex";
import type { BranchResult, LoadResult, NodeResult, SourceResult } from "./results";
import { solvePowerFlow, type PfResult } from "./solvers/powerflow";
import { input } from "./trace";

export { SBASE };

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
}

const invert = (z: Complex): Complex => C(z.re / (z.re ** 2 + z.im ** 2), -z.im / (z.re ** 2 + z.im ** 2));

/** Power the slack node delivers: what flows out through its branches plus what is connected right at it. */
function slackPower(m: PfModel, pf: PfResult, i: number): Complex {
  let cur = C(0);
  for (const b of m.infos) {
    const other = b.from === i ? b.to : b.to === i ? b.from : -1;
    if (other >= 0) cur = add(cur, mul(sub(pf.v[i]!, pf.v[other]!), invert(b.z)));
  }
  return add(scale(mul(pf.v[i]!, conj(cur)), SBASE), scale(m.nodes[i]!.s, -SBASE));
}

export function solveFlow(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  converterInputW: Map<string, number>,
  profileId: "il" | "iec",
  diags: Diagnostic[],
): FlowOutput | undefined {
  const m = buildPfModel(g, isl, base, converterInputW, diags);
  if (!m) return undefined;
  let pf: PfResult;
  try {
    pf = solvePowerFlow(m.nodes, m.infos);
  } catch {
    diags.push(diagnostic(ENGINE_CODES.loadflowNotConverged, "error", isl.nodes, { reason: "singular" }));
    return undefined;
  }
  if (!pf.converged)
    diags.push(diagnostic(ENGINE_CODES.loadflowNotConverged, "error", isl.nodes, { iterations: pf.iterations }));
  const voltage = new Map(isl.nodes.map((n, i) => [n, pf.v[i]!]));
  const common = [input("Sbase", SBASE, "VA", "computed")];
  const limit = profiles.rows[profileId].maxDropPercent;
  const out: FlowOutput = {
    nodes: nodeResults(g, isl, base, pf, common),
    branches: branchResults(m, pf, isl.system!, common),
    loads: loadResults(g, isl, base, voltage, limit, diags),
    sources: [],
    method: pf.method,
    iterations: pf.iterations,
    converged: pf.converged,
    outputW: new Map(),
  };
  for (const [i, d] of m.slackNode) {
    const s = slackPower(m, pf, i);
    out.outputW.set(d.device.id, s.re);
    out.sources.push(sourceResults(d, s.re, s.im, common));
  }
  for (const d of isl.devs) {
    if (d.def.category === "source" && d.def.sourceRole === "pq" && !m.slacks.includes(d)) {
      const s = d.def.supply!(d.p);
      out.sources.push(sourceResults(d, s.p, s.q, common));
    }
  }
  return out;
}
