import { getComponent } from "@flow/catalog";
import type { Cable, Device, Project } from "@flow/model";

export interface BoqSettings {
  slackPerEndM: number;
  sparePercent: number;
}
export const DEFAULT_BOQ: BoqSettings = { slackPerEndM: 1, sparePercent: 5 };

export type LineClass = "device" | "cable" | "assembly";
export interface BoqLine {
  key: string;
  class: LineClass;
  /** Language-neutral description: what it is and its attributes, for the interface to word */
  what: string;
  attrs: Record<string, string | number>;
  unit: "pc" | "m";
  quantity: number;
  /** Why the quantity is what it is, for cables: length and allowances */
  note?: { lengthM: number; slackPerEndM: number; sparePercent: number };
}

/** Which parameters identify an item of each kind. Kinds not listed are not purchased (sources, generic loads). */
export const KEY_ATTRS: Record<string, string[]> = {
  breaker: ["ratedCurrent", "breakingCapacity"],
  fuse: ["ratedCurrent", "breakingCapacity"],
  contactor: ["ratedCurrent"],
  disconnector: ["ratedCurrent"],
  earthing_disconnector: [],
  meter: [],
  busbar: ["ratedCurrent"],
  transformer: ["ratedPower", "primaryVoltage", "secondaryVoltage"],
  generator: ["ratedPower", "voltage"],
  rectifier: ["outputVoltage"],
  inverter: ["outputVoltage"],
  cc_regulator: ["current", "maxVoltage"],
  battery: ["voltage"],
  solar_array: ["voltage", "ratedPower"],
  motor: ["power"],
  capacitor: ["reactivePower"],
};

/** Visible, editable data: what each assembly rule adds. */
export interface AssemblyRule {
  id: string;
  per: "conductor-end" | "device";
  what: string;
}
export const ASSEMBLY_RULES: AssemblyRule[] = [
  { id: "lug", per: "conductor-end", what: "cable_lug" },
  { id: "label", per: "device", what: "label" },
];

const num = (v: unknown): number | undefined =>
  typeof v === "number" ? v : typeof v === "object" && v !== null && "v" in v ? (v as { v: number }).v : undefined;
const round = (n: number): number => Math.round(n * 1000) / 1000;

function deviceAttrs(d: Device): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const name of KEY_ATTRS[d.kind] ?? []) {
    const v = num(d.params[name]);
    if (v !== undefined) out[name] = v;
  }
  return out;
}

const keyOf = (what: string, attrs: Record<string, string | number>): string =>
  [what, ...Object.entries(attrs).map(([k, v]) => `${k}=${v}`)].join("|");

function add(map: Map<string, BoqLine>, line: Omit<BoqLine, "key">): void {
  const key = keyOf(line.what, line.attrs);
  const old = map.get(key);
  map.set(
    key,
    old
      ? {
          ...old,
          quantity: round(old.quantity + line.quantity),
          ...(line.note && old.note
            ? { note: { ...old.note, lengthM: round(old.note.lengthM + line.note.lengthM) } }
            : {}),
        }
      : { ...line, key },
  );
}

function cableLines(p: Project, s: BoqSettings, map: Map<string, BoqLine>): void {
  for (const c of p.cables as Cable[]) {
    const k = c.conductors[0];
    if (!k || !p.wires.some((w) => w.cableId === c.id)) continue;
    const attrs = {
      material: k.material,
      insulation: k.insulation,
      sectionMm2: k.sectionMm2,
      conductors: c.conductors.length,
    };
    const length = (c.lengthM + 2 * s.slackPerEndM) * (1 + s.sparePercent / 100);
    add(map, {
      class: "cable",
      what: "cable",
      attrs,
      unit: "m",
      quantity: round(length),
      note: { lengthM: c.lengthM, slackPerEndM: s.slackPerEndM, sparePercent: s.sparePercent },
    });
  }
}

function assemblyLines(p: Project, map: Map<string, BoqLine>): void {
  for (const rule of ASSEMBLY_RULES) {
    if (rule.per === "conductor-end") {
      for (const c of p.cables)
        for (const k of c.conductors)
          if (p.wires.some((w) => w.cableId === c.id))
            add(map, {
              class: "assembly",
              what: rule.what,
              attrs: { sectionMm2: k.sectionMm2 },
              unit: "pc",
              quantity: 2,
            });
    } else {
      for (const d of p.devices)
        if (KEY_ATTRS[d.kind]) add(map, { class: "assembly", what: rule.what, attrs: {}, unit: "pc", quantity: 1 });
    }
  }
}

/** Quantities derived from the model. Nothing here is typed by hand. */
export function billOfQuantities(p: Project, settings: BoqSettings = DEFAULT_BOQ): BoqLine[] {
  const map = new Map<string, BoqLine>();
  for (const d of p.devices)
    if (getComponent(d.kind) && KEY_ATTRS[d.kind])
      add(map, { class: "device", what: d.kind, attrs: deviceAttrs(d), unit: "pc", quantity: 1 });
  cableLines(p, settings, map);
  assemblyLines(p, map);
  return [...map.values()].sort((a, b) => a.class.localeCompare(b.class) || a.key.localeCompare(b.key));
}
