import { getComponent } from "@flow/catalog";
import type { Results } from "@flow/engine";
import type { Cable, Project } from "@flow/model";
import { feedWire, protectiveUpstream } from "./upstream";

export interface CircuitRow {
  deviceId: string;
  name: string;
  kind: string;
  protective?: { id: string; name: string; ratedA: number };
  cable?: { material: string; insulation: string; sectionMm2: number; lengthM: number; conductors: number };
  powerW?: number;
  currentA?: number;
  voltageV?: number;
  dropPercent?: number;
  faultA?: number;
  /** True when every cable check passed, false when one failed, undefined when none ran */
  cableOk?: boolean;
}

const val = (v: unknown): number | undefined =>
  typeof v === "number" ? v : typeof v === "object" && v !== null && "v" in v ? (v as { v: number }).v : undefined;

function cableOf(c: Cable | undefined): CircuitRow["cable"] {
  const k = c?.conductors[0];
  return c && k
    ? {
        material: k.material,
        insulation: k.insulation,
        sectionMm2: k.sectionMm2,
        lengthM: c.lengthM,
        conductors: c.conductors.length,
      }
    : undefined;
}

function rowFor(p: Project, results: Results, d: Project["devices"][number], inId: string): CircuitRow {
  const wireId = feedWire(p, inId);
  const wire = p.wires.find((w) => w.id === wireId);
  const prot = protectiveUpstream(p, inId);
  const load = results.loads.find((l) => l.deviceId === d.id);
  const check = results.cableChecks.find((c) => c.wireId === wireId);
  const fault = results.faults.find((f) => f.terminals.includes(inId));
  const row: CircuitRow = { deviceId: d.id, name: d.name, kind: d.kind };
  if (prot) row.protective = { id: prot.id, name: prot.name, ratedA: val(prot.params["ratedCurrent"]) ?? 0 };
  const cable = cableOf(p.cables.find((c) => c.id === wire?.cableId));
  if (cable) row.cable = cable;
  if (load)
    Object.assign(row, {
      powerW: load.activePower.value,
      voltageV: load.voltage.value,
      dropPercent: load.dropPercent.value,
    });
  if (check) row.currentA = check.ib.value;
  if (check?.passes) row.cableOk = Object.values(check.passes).every(Boolean);
  if (fault) row.faultA = fault.ik3Max.value;
  return row;
}

/** One row per consumer. Values the engine did not produce stay absent. */
export function circuitSchedule(p: Project, results: Results): CircuitRow[] {
  const rows: CircuitRow[] = [];
  for (const d of p.devices) {
    const term = p.terminals.find((t) => t.deviceId === d.id && t.role === "in");
    if (getComponent(d.kind)?.category === "load" && term) rows.push(rowFor(p, results, d, term.id));
  }
  return rows;
}
