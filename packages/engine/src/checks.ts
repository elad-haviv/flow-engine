import { conductors, lookupAmpacity } from "@flow/catalog";
import { diagnostic, nodeKey, type Cable, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import { phaseConductor } from "./cables";
import type { Graph, Island, WireInfo } from "./graph";
import { num, type Dev } from "./params";
import type { BranchResult, CableCheck, FaultResult } from "./results";
import { input, traced, type Traced } from "./trace";

type Conductor = NonNullable<ReturnType<typeof phaseConductor>>;
const round1 = (n: number): number => Math.round(n * 10) / 10;

/** The protective device sitting directly at either end of a wire. */
function protectiveAt(g: Graph, w: WireInfo): Dev | undefined {
  for (const e of [w.wire.from, w.wire.to]) {
    const d = "terminalId" in e ? g.byTerminal.get(e.terminalId) : undefined;
    if (d?.def.protective) return d;
  }
  return undefined;
}

function ampacityOf(
  cable: Cable,
  cond: Conductor,
  system: string | undefined,
  diags: Diagnostic[],
): Traced | undefined {
  const loaded = system === "ac3" ? 3 : 2;
  const iz0 = lookupAmpacity(cable.installation, cond.material, cond.insulation, loaded, cond.sectionMm2);
  if (iz0 === undefined) {
    const params = {
      method: cable.installation,
      material: cond.material,
      insulation: cond.insulation,
      section: cond.sectionMm2,
    };
    diags.push(diagnostic(ENGINE_CODES.noTable, "error", [cable.id], params));
    return undefined;
  }
  return traced(
    iz0,
    "A",
    `cable:${cable.id}.iz`,
    "Iz = table value * k_temperature * k_grouping",
    [
      input("table", iz0, "A", "standard"),
      input("k_temperature", 1, "ratio", "default"),
      input("k_grouping", 1, "ratio", "default"),
    ],
    { clause: "IEC 60364-5-52 table B.52 series", assumed: true },
  );
}

function requiredSection(cable: Cable, cond: Conductor, prot: Dev, ik: number | undefined): Traced | undefined {
  const k = conductors.rows.k[cond.material][cond.insulation];
  if (ik === undefined || !k) return undefined;
  const t = num(prot, "clearTime");
  const origin = prot.defaulted.includes("clearTime") ? "default" : "entered";
  return traced(
    (ik * Math.sqrt(t)) / k,
    "mm2",
    `cable:${cable.id}.requiredSection`,
    "S >= I * sqrt(t) / k",
    [input("I", ik, "A", "computed"), input("t", t, "s", origin), input("k", k, "A s^0.5/mm2", "standard")],
    { clause: "IEC 60364-4-43 eq. 43.1" },
  );
}

function reportFailures(
  cable: Cable,
  prot: Dev,
  v: { ib: number; inA: number; iz: number; i2: number; section: number },
  passes: NonNullable<CableCheck["passes"]>,
  diags: Diagnostic[],
): void {
  const ids = [cable.id, prot.device.id];
  if (!passes.current)
    diags.push(diagnostic(ENGINE_CODES.cableDesignCurrent, "error", ids, { ib: round1(v.ib), in: v.inA }));
  if (!passes.capacity) diags.push(diagnostic(ENGINE_CODES.cableRatingCapacity, "error", ids, { in: v.inA, iz: v.iz }));
  if (!passes.i2)
    diags.push(diagnostic(ENGINE_CODES.cableI2, "error", ids, { i2: round1(v.i2), limit: round1(1.45 * v.iz) }));
  if (!passes.thermal) diags.push(diagnostic(ENGINE_CODES.cableThermal, "error", [cable.id], { section: v.section }));
}

function checkProtected(
  cable: Cable,
  cond: Conductor,
  prot: Dev,
  base: CableCheck,
  iz: Traced,
  ik: number | undefined,
  diags: Diagnostic[],
): CableCheck {
  const inA = num(prot, "ratedCurrent");
  const k2 = num(prot, "i2Factor");
  const origin = prot.defaulted.includes("i2Factor") ? "default" : "entered";
  const q = (k: string) => `cable:${cable.id}.${k}`;
  const i2 = traced(k2 * inA, "A", q("i2"), "I2 = k2 * In", [input("k2", k2, "ratio", origin), input("In", inA, "A")], {
    clause: "IEC 60364-4-43 eq. 43.2",
  });
  const required = requiredSection(cable, cond, prot, ik);
  const passes = {
    current: base.ib.value <= inA,
    capacity: inA <= iz.value,
    i2: k2 * inA <= 1.45 * iz.value,
    thermal: required === undefined || cond.sectionMm2 >= required.value,
  };
  reportFailures(
    cable,
    prot,
    { ib: base.ib.value, inA, iz: iz.value, i2: k2 * inA, section: cond.sectionMm2 },
    passes,
    diags,
  );
  return {
    ...base,
    in: traced(inA, "A", q("in"), "protective device rating", [input("In", inA, "A")]),
    i2,
    ...(required ? { requiredSection: required } : {}),
    passes,
  };
}

function checkOne(
  g: Graph,
  isl: Island,
  w: WireInfo,
  branches: BranchResult[],
  faultAt: Map<string, FaultResult>,
  diags: Diagnostic[],
): CableCheck | undefined {
  const cable = g.project.cables.find((c) => c.id === w.wire.cableId)!;
  const br = branches.find((b) => b.id === w.wire.id);
  const cond = phaseConductor(cable);
  if (!br || !cond) return undefined;
  const iz = ampacityOf(cable, cond, isl.system, diags);
  const base: CableCheck = { cableId: cable.id, wireId: w.wire.id, ib: br.current, passes: undefined };
  if (!iz) return base;
  const prot = protectiveAt(g, w);
  if (prot) {
    const ends = [w.a, w.b].map((n) => faultAt.get(n)).filter((f): f is FaultResult => !!f);
    const ik = ends.length ? Math.max(...ends.map((f) => f.ik3Max.value)) : undefined;
    return checkProtected(cable, cond, prot, { ...base, iz }, iz, ik, diags);
  }
  diags.push(diagnostic(ENGINE_CODES.cableUnprotected, "warning", [cable.id]));
  const ok = br.current.value <= iz.value;
  if (!ok)
    diags.push(
      diagnostic(ENGINE_CODES.cableAmpacity, "error", [cable.id], { ib: round1(br.current.value), iz: iz.value }),
    );
  return { ...base, iz, passes: { current: ok, capacity: true, i2: true, thermal: true } };
}

export function checkCables(
  g: Graph,
  isl: Island,
  branches: BranchResult[],
  faults: FaultResult[],
  diags: Diagnostic[],
): CableCheck[] {
  const faultAt = new Map(faults.map((f) => [f.nodeKey, f]));
  return isl.wires.map((w) => checkOne(g, isl, w, branches, faultAt, diags)).filter((c): c is CableCheck => !!c);
}

/** Each protective device must be able to break the largest fault current at its location. */
export function checkBreaking(g: Graph, isl: Island, faults: FaultResult[], diags: Diagnostic[]): void {
  const faultAt = new Map(faults.map((f) => [f.nodeKey, f]));
  for (const d of isl.devs) {
    if (!d.def.protective) continue;
    const ends = [d.term.in, d.term.out]
      .filter((t): t is string => !!t)
      .map((t) => faultAt.get(g.rep(t)))
      .filter((f): f is FaultResult => !!f);
    if (!ends.length) continue;
    const ik = Math.max(...ends.map((f) => f.ik3Max.value));
    const icu = num(d, "breakingCapacity");
    if (ik > icu)
      diags.push(
        diagnostic(ENGINE_CODES.breakingCapacity, "error", [d.device.id], { fault: Math.round(ik), capacity: icu }),
      );
  }
}

/** Busbar advice: three or more wires on one terminal that is not already a busbar. */
export function adviseBusbars(g: Graph, diags: Diagnostic[]): void {
  const count = new Map<string, number>();
  for (const w of g.project.wires) {
    for (const e of [w.from, w.to]) {
      const k = nodeKey(g.project, e);
      count.set(k, (count.get(k) ?? 0) + 1);
    }
  }
  for (const t of g.project.terminals) {
    const n = count.get(t.id) ?? 0;
    if (t.role !== "bus" && n >= 3)
      diags.push(diagnostic(ENGINE_CODES.busbarSuggest, "info", [t.id, t.deviceId], { count: n }));
  }
}
