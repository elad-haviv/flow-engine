export const UNITS = ["V", "A", "Ω", "W", "VA", "var", "Hz", "m", "mm²", "°C", "s"] as const;
export type Unit = (typeof UNITS)[number];

export interface Quantity {
  v: number;
  u: Unit;
}

const TO_SI: Record<string, { unit: Unit; factor: number }> = {
  V: { unit: "V", factor: 1 },
  kV: { unit: "V", factor: 1e3 },
  A: { unit: "A", factor: 1 },
  kA: { unit: "A", factor: 1e3 },
  Ω: { unit: "Ω", factor: 1 },
  mΩ: { unit: "Ω", factor: 1e-3 },
  W: { unit: "W", factor: 1 },
  kW: { unit: "W", factor: 1e3 },
  MW: { unit: "W", factor: 1e6 },
  VA: { unit: "VA", factor: 1 },
  kVA: { unit: "VA", factor: 1e3 },
  MVA: { unit: "VA", factor: 1e6 },
  var: { unit: "var", factor: 1 },
  kvar: { unit: "var", factor: 1e3 },
  Hz: { unit: "Hz", factor: 1 },
  m: { unit: "m", factor: 1 },
  km: { unit: "m", factor: 1e3 },
  mm: { unit: "m", factor: 1e-3 },
  "mm²": { unit: "mm²", factor: 1 },
  "°C": { unit: "°C", factor: 1 },
  s: { unit: "s", factor: 1 },
  ms: { unit: "s", factor: 1e-3 },
};

/** Convert a value in any known unit to its SI quantity. Throws on unknown unit. */
export function toSI(value: number, unit: string): Quantity {
  const e = TO_SI[unit];
  if (!e) throw new Error(`model.units.unknown: ${unit}`);
  return { v: value * e.factor, u: e.unit };
}

/** Convert an SI quantity to the given unit. */
export function fromSI(q: Quantity, unit: string): number {
  const e = TO_SI[unit];
  if (!e || e.unit !== q.u) throw new Error(`model.units.mismatch: ${q.u} -> ${unit}`);
  return q.v / e.factor;
}
