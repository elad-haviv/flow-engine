import { conductors, lookupAmpacity, type StandardTable } from "@flow/catalog";
import { diagnostic, nodeKey, type Diagnostic } from "@flow/model";
import { ENGINE_CODES } from "./codes";
import { phaseConductor } from "./cables";
import type { Graph, Island } from "./graph";
import { num, type Dev } from "./params";
import type { BranchResult, CableCheck, FaultResult } from "./results";
import { input, traced } from "./trace";

/** The protective device sitting directly at either end of a wire. */
function protectiveAt(g: Graph, ends: string[]): Dev | undefined {
  for (const t of ends) {
    const d = g.byTerminal.get(t);
    if (d?.def.protective) return d;
  }
  return undefined;
}

export function checkCables(
  g: Graph,
  isl: Island,
  branches: BranchResult[],
  faults: FaultResult[],
  tablesUsed: Set<StandardTable<unknown>>,
  diags: Diagnostic[],
): CableCheck[] {
  const out: CableCheck[] = [];
  const faultAt = new Map(faults.map((f) => [f.nodeKey, f]));
  for (const w of isl.wires) {
    const cable = g.project.cables.find((c) => c.id === w.wire.cableId)!;
    const br = branches.find((b) => b.id === w.wire.id);
    const cond = phaseConductor(cable);
    if (!br || !cond) continue;
    const ib = br.current;
    const q = (k: string) => `cable:${cable.id}.${k}`;
    const loaded = isl.system === "ac3" ? 3 : 2;
    const iz0 = lookupAmpacity(cable.installation, cond.material, cond.insulation, loaded, cond.sectionMm2);
    if (iz0 === undefined) {
      diags.push(
        diagnostic(ENGINE_CODES.noTable, "error", [cable.id], {
          method: cable.installation,
          material: cond.material,
          insulation: cond.insulation,
          section: cond.sectionMm2,
        }),
      );
      out.push({ cableId: cable.id, wireId: w.wire.id, ib, passes: undefined });
      continue;
    }
    tablesUsed.add(conductors).add({ id: "ampacity" } as StandardTable<unknown>);
    diags.push(
      diagnostic(ENGINE_CODES.assumption, "info", [cable.id], { what: "temperature and grouping factors = 1" }),
    );
    const iz = traced(
      iz0,
      "A",
      q("iz"),
      "Iz = table value * k_temperature * k_grouping",
      [
        input("table", iz0, "A", "standard"),
        input("k_temperature", 1, "ratio", "default"),
        input("k_grouping", 1, "ratio", "default"),
      ],
      { clause: "IEC 60364-5-52 table B.52 series", assumed: true },
    );
    const prot = protectiveAt(
      g,
      [w.wire.from, w.wire.to].map((e) => ("terminalId" in e ? e.terminalId : "")).filter(Boolean),
    );
    const check: CableCheck = { cableId: cable.id, wireId: w.wire.id, ib, iz, passes: undefined };
    if (!prot) {
      diags.push(diagnostic(ENGINE_CODES.cableUnprotected, "warning", [cable.id]));
      const ok = ib.value <= iz.value;
      if (!ok)
        diags.push(
          diagnostic(ENGINE_CODES.cableAmpacity, "error", [cable.id], {
            ib: Math.round(ib.value * 10) / 10,
            iz: iz.value,
          }),
        );
      out.push({ ...check, passes: { current: ok, capacity: true, i2: true, thermal: true } });
      continue;
    }
    const inA = num(prot, "ratedCurrent");
    const k2 = num(prot, "i2Factor");
    const t = num(prot, "clearTime");
    const origin = prot.defaulted.includes("i2Factor") ? "default" : "entered";
    const i2 = traced(
      k2 * inA,
      "A",
      q("i2"),
      "I2 = k2 * In",
      [input("k2", k2, "ratio", origin), input("In", inA, "A")],
      { clause: "IEC 60364-4-43 eq. 43.2" },
    );
    const nodes = [w.a, w.b].map((n) => faultAt.get(n)).filter((f): f is FaultResult => !!f);
    const ik = nodes.length ? Math.max(...nodes.map((f) => f.ik3Max.value)) : undefined;
    const k = conductors.rows.k[cond.material][cond.insulation];
    let thermal = true;
    let required;
    if (ik !== undefined && k) {
      const s = (ik * Math.sqrt(t)) / k;
      thermal = cond.sectionMm2 >= s;
      required = traced(
        s,
        "mm2",
        q("requiredSection"),
        "S >= I * sqrt(t) / k",
        [
          input("I", ik, "A", "computed"),
          input("t", t, "s", prot.defaulted.includes("clearTime") ? "default" : "entered"),
          input("k", k, "A s^0.5/mm2", "standard"),
        ],
        { clause: "IEC 60364-4-43 eq. 43.1" },
      );
    }
    const passes = { current: ib.value <= inA, capacity: inA <= iz0, i2: k2 * inA <= 1.45 * iz0, thermal };
    const mm = (n: number) => Math.round(n * 10) / 10;
    if (!passes.current)
      diags.push(
        diagnostic(ENGINE_CODES.cableDesignCurrent, "error", [cable.id, prot.device.id], { ib: mm(ib.value), in: inA }),
      );
    if (!passes.capacity)
      diags.push(
        diagnostic(ENGINE_CODES.cableRatingCapacity, "error", [cable.id, prot.device.id], { in: inA, iz: iz0 }),
      );
    if (!passes.i2)
      diags.push(
        diagnostic(ENGINE_CODES.cableI2, "error", [cable.id, prot.device.id], {
          i2: mm(k2 * inA),
          limit: mm(1.45 * iz0),
        }),
      );
    if (!passes.thermal)
      diags.push(diagnostic(ENGINE_CODES.cableThermal, "error", [cable.id], { section: cond.sectionMm2 }));
    out.push({
      ...check,
      in: traced(inA, "A", q("in"), "protective device rating", [input("In", inA, "A")]),
      i2,
      ...(required ? { requiredSection: required } : {}),
      passes,
    });
  }
  return out;
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
  for (const w of g.project.wires)
    for (const e of [w.from, w.to]) {
      const k = nodeKey(g.project, e);
      count.set(k, (count.get(k) ?? 0) + 1);
    }
  for (const t of g.project.terminals) {
    const n = count.get(t.id) ?? 0;
    if (t.role !== "bus" && n >= 3)
      diags.push(diagnostic(ENGINE_CODES.busbarSuggest, "info", [t.id, t.deviceId], { count: n }));
  }
}
