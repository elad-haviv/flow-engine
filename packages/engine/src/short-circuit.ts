import { profiles } from "@flow/catalog";
import { diagnostic, type Cable, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import { wireImpedance, type TempMode } from "./cables";
import type { Graph, Island } from "./graph";
import { C, abs, add, scale, type Complex } from "./numeric/complex";
import { complexLu, solveComplexLu } from "./numeric/lu";
import type { FaultResult } from "./results";
import { SBASE } from "./flow";
import { input, traced } from "./trace";

const CLAUSE = "IEC 60909-0";
const F_HZ = 50;
const TK_S = 1;

type ProfileId = "il" | "iec";
const factors = (profileId: ProfileId, vb: number) => {
  const c = profiles.rows[profileId].cFactors;
  return vb <= 1000 ? { max: c.lvMax, min: c.lvMin } : { max: c.mvMax, min: c.mvMin };
};

interface ScBranch {
  i: number;
  j: number;
  z: Complex;
}
interface ScNetwork {
  branches: ScBranch[];
  shunt: boolean[];
  shuntY: Complex[];
}

const inv = (z: Complex): Complex => C(z.re / (z.re ** 2 + z.im ** 2), -z.im / (z.re ** 2 + z.im ** 2));

function scWires(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  idx: Map<string, number>,
  temp: TempMode,
  diags: Diagnostic[],
): ScBranch[] | undefined {
  const out: ScBranch[] = [];
  for (const w of isl.wires) {
    const z = wireImpedance(g.project.cables.find((c) => c.id === w.wire.cableId) as Cable, "ac3", temp);
    if (!z) {
      diags.push(diagnostic(ENGINE_CODES.cableNoConductor, "error", [w.wire.cableId]));
      return undefined;
    }
    out.push({ i: idx.get(w.a)!, j: idx.get(w.b)!, z: scale(z.z, 1 / (base.get(w.a)! ** 2 / SBASE)) });
  }
  return out;
}

function scTransformers(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  idx: Map<string, number>,
  profileId: ProfileId,
): ScBranch[] {
  const out: ScBranch[] = [];
  for (const d of isl.devs) {
    if (d.def.category !== "transformer" || !d.def.seriesImpedance) continue;
    const t = d.def.seriesImpedance(d.p);
    const a = g.rep(d.term.in!);
    const b = g.rep(d.term.out!);
    const kt = (0.95 * factors(profileId, base.get(b)!).max) / (1 + 0.6 * t.x);
    const f = (kt * SBASE) / t.ratedVA;
    if (a !== b) out.push({ i: idx.get(a)!, j: idx.get(b)!, z: C(t.r * f, t.x * f) });
  }
  return out;
}

function scSources(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  idx: Map<string, number>,
  profileId: ProfileId,
  mode: "max" | "min",
  net: ScNetwork,
): void {
  for (const d of isl.devs) {
    if (!d.def.sourceImpedance || !d.term.out) continue;
    const node = g.rep(d.term.out);
    const vb = base.get(node)!;
    const c = factors(profileId, vb);
    const z = d.def.sourceImpedance(d.p, vb, mode === "max" ? c.max : c.min, c.max);
    const i = idx.get(node)!;
    net.shunt[i] = true;
    net.shuntY[i] = add(net.shuntY[i]!, inv(C((z.r * SBASE) / vb ** 2, (z.x * SBASE) / vb ** 2)));
  }
}

/**
 * Leaves (one branch, no source) carry no fault current for the rest of the network:
 * their impedance is the parent's plus the branch, so only the core needs the matrix inverse.
 */
function peelLeaves(n: number, branches: ScBranch[], shunt: boolean[]) {
  const degree = new Array<number>(n).fill(0);
  for (const b of branches) {
    degree[b.i]!++;
    degree[b.j]!++;
  }
  const removed = new Array<boolean>(n).fill(false);
  const peeled: Array<{ leaf: number; parent: number; z: Complex }> = [];
  const stack = [...Array(n).keys()].filter((i) => degree[i] === 1 && !shunt[i]);
  while (stack.length) {
    const leaf = stack.pop()!;
    const br = removed[leaf] ? undefined : branches.find((b) => b.i >= 0 && (b.i === leaf || b.j === leaf));
    if (!br) continue;
    const parent = br.i === leaf ? br.j : br.i;
    removed[leaf] = true;
    peeled.push({ leaf, parent, z: br.z });
    degree[parent]!--;
    br.i = br.j = -1;
    if (degree[parent] === 1 && !shunt[parent]) stack.push(parent);
  }
  return { removed, peeled };
}

function coreMatrix(core: number[], branches: ScBranch[], shuntY: Complex[]): Complex[][] {
  const pos = new Map(core.map((node, k) => [node, k]));
  const Y = core.map(() => core.map(() => C(0)));
  for (const b of branches) {
    if (b.i < 0) continue;
    const y = inv(b.z);
    const i = pos.get(b.i)!;
    const j = pos.get(b.j)!;
    Y[i]![i] = add(Y[i]![i]!, y);
    Y[j]![j] = add(Y[j]![j]!, y);
    Y[i]![j] = add(Y[i]![j]!, scale(y, -1));
    Y[j]![i] = add(Y[j]![i]!, scale(y, -1));
  }
  core.forEach((node, k) => {
    Y[k]![k] = add(Y[k]![k]!, shuntY[node]!);
  });
  return Y;
}

/** Thevenin impedance (pu) at every node of a three-phase island, for one set of conditions. */
function thevenin(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  profileId: ProfileId,
  mode: "max" | "min",
  diags: Diagnostic[],
): Complex[] | undefined {
  const n = isl.nodes.length;
  const idx = new Map(isl.nodes.map((k, i) => [k, i]));
  const wires = scWires(g, isl, base, idx, mode === "max" ? "scMax" : "scMin", diags);
  if (!wires) return undefined;
  const branches = [...wires, ...scTransformers(g, isl, base, idx, profileId)];
  const net: ScNetwork = {
    branches,
    shunt: new Array<boolean>(n).fill(false),
    shuntY: new Array<Complex>(n).fill(C(0)),
  };
  scSources(g, isl, base, idx, profileId, mode, net);
  const { removed, peeled } = peelLeaves(n, branches, net.shunt);
  const core = [...Array(n).keys()].filter((i) => !removed[i]);
  if (!core.some((i) => net.shunt[i])) return undefined;
  let lu;
  try {
    lu = complexLu(coreMatrix(core, branches, net.shuntY));
  } catch {
    return undefined;
  }
  const z = new Array<Complex>(n).fill(C(0));
  core.forEach((node, k) => {
    z[node] = solveComplexLu(
      lu,
      core.map((_, m) => (m === k ? C(1) : C(0))),
    )[k]!;
  });
  for (let k = peeled.length - 1; k >= 0; k--) z[peeled[k]!.leaf] = add(z[peeled[k]!.parent]!, peeled[k]!.z);
  return z;
}

/** Short-circuit currents per IEC 60909 for three-phase and phase-to-phase faults, far from generator. */
export function shortCircuit(
  g: Graph,
  isl: Island,
  base: Map<string, number>,
  profileId: ProfileId,
  diags: Diagnostic[],
): FaultResult[] {
  if (isl.system !== "ac3") {
    diags.push(diagnostic(ENGINE_CODES.scUnsupported, "info", isl.nodes, { system: isl.system ?? "" }));
    return [];
  }
  if (isl.devs.some((d) => d.def.category === "load" || d.def.category === "converter"))
    diags.push(diagnostic(ENGINE_CODES.scExcluded, "info", isl.nodes));
  const gens = isl.devs.filter((d) => d.def.category === "source" && d.def.sourceRole === "pq");
  if (gens.length)
    diags.push(
      diagnostic(
        ENGINE_CODES.scNearGenerator,
        "warning",
        gens.map((d) => d.device.id),
      ),
    );
  const zmax = thevenin(g, isl, base, profileId, "max", diags);
  const zmin = thevenin(g, isl, base, profileId, "min", diags);
  if (!zmax || !zmin) return [];
  return isl.nodes.map((node, i) => {
    const vb = base.get(node)!;
    const c = factors(profileId, vb);
    const ohm = (z: Complex) => (abs(z) * (vb * vb)) / SBASE;
    const i3max = (c.max * vb) / (Math.sqrt(3) * ohm(zmax[i]!));
    const i3min = (c.min * vb) / (Math.sqrt(3) * ohm(zmin[i]!));
    const rx = zmax[i]!.im > 0 ? zmax[i]!.re / zmax[i]!.im : 0;
    const kappa = 1.02 + 0.98 * Math.exp(-3 * rx);
    const lk = Math.log(kappa - 1);
    const m = Math.abs(lk) < 1e-9 ? 2 : (Math.exp(4 * F_HZ * TK_S * lk) - 1) / (2 * F_HZ * TK_S * lk);
    const q = (k: string) => `fault:${node}.${k}`;
    const common = [input("Un", vb, "V"), input("Zk_max", ohm(zmax[i]!), "ohm", "computed")];
    const cMax = input("c_max", c.max, "ratio", "standard");
    const cMin = input("c_min", c.min, "ratio", "standard");
    return {
      nodeKey: node,
      terminals: g.project.terminals.filter((t) => g.rep(t.id) === node).map((t) => t.id),
      ik3Max: traced(i3max, "A", q("ik3Max"), "I''k3 = c * Un / (sqrt(3) * |Zk|)", [...common, cMax], {
        clause: `${CLAUSE} eq. 29`,
      }),
      ik3Min: traced(
        i3min,
        "A",
        q("ik3Min"),
        "I''k3 = c_min * Un / (sqrt(3) * |Zk|), cable resistance at 80 degrees C",
        [input("Un", vb, "V"), input("Zk_min", ohm(zmin[i]!), "ohm", "computed"), cMin],
        { clause: `${CLAUSE} section 2.5`, assumed: true },
      ),
      ik2Min: traced(
        (Math.sqrt(3) / 2) * i3min,
        "A",
        q("ik2Min"),
        "I''k2 = sqrt(3)/2 * I''k3 (Z1 = Z2)",
        [input("Ik3Min", i3min, "A", "computed")],
        { clause: `${CLAUSE} eq. 45` },
      ),
      ipMax: traced(
        kappa * Math.SQRT2 * i3max,
        "A",
        q("ipMax"),
        "ip = kappa * sqrt(2) * I''k3, kappa = 1.02 + 0.98 * exp(-3 R/X)",
        [input("Ik3Max", i3max, "A", "computed"), input("R/X", rx, "ratio", "computed")],
        { clause: `${CLAUSE} eq. 54` },
      ),
      ithMax: traced(
        i3max * Math.sqrt(m + 1),
        "A",
        q("ithMax"),
        "Ith = I''k3 * sqrt(m + n), n = 1, m from kappa",
        [
          input("Ik3Max", i3max, "A", "computed"),
          input("kappa", kappa, "ratio", "computed"),
          input("Tk", TK_S, "s", "default"),
          input("f", F_HZ, "Hz", "default"),
        ],
        { clause: `${CLAUSE} eq. 102`, assumed: true },
      ),
      rxRatio: traced(rx, "ratio", q("rx"), "R/X of the Thevenin impedance", [
        input("R", zmax[i]!.re, "pu", "computed"),
        input("X", zmax[i]!.im, "pu", "computed"),
      ]),
    };
  });
}
