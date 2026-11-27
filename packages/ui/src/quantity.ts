export const UNIT_FAMILIES: Record<string, Array<{ unit: string; factor: number }>> = {
  V: [
    { unit: "V", factor: 1 },
    { unit: "kV", factor: 1e3 },
  ],
  A: [
    { unit: "A", factor: 1 },
    { unit: "kA", factor: 1e3 },
  ],
  W: [
    { unit: "W", factor: 1 },
    { unit: "kW", factor: 1e3 },
    { unit: "MW", factor: 1e6 },
  ],
  VA: [
    { unit: "VA", factor: 1 },
    { unit: "kVA", factor: 1e3 },
    { unit: "MVA", factor: 1e6 },
  ],
  var: [
    { unit: "var", factor: 1 },
    { unit: "kvar", factor: 1e3 },
  ],
  s: [
    { unit: "s", factor: 1 },
    { unit: "ms", factor: 1e-3 },
  ],
};

export interface Display {
  value: number;
  unit: string;
}

/** The largest unit in which the value is at least 1 (or the base unit for small values). */
export function bestUnit(si: number, family: string): Display {
  const units = UNIT_FAMILIES[family];
  if (!units) return { value: si, unit: family };
  const abs = Math.abs(si);
  let pick = units[0]!;
  for (const u of units) if (u.factor >= 1 && abs >= u.factor) pick = u;
  if (family === "s" && abs > 0 && abs < 1) pick = units[1]!;
  return { value: si / pick.factor, unit: pick.unit };
}

export function toBase(value: number, unit: string, family: string): number {
  const f = UNIT_FAMILIES[family]?.find((u) => u.unit === unit)?.factor ?? 1;
  return value * f;
}

/** Parse what a person typed: a plain number, with a comma allowed as decimal separator. */
export function parseNumber(text: string): number | undefined {
  const t = text.trim().replace(",", ".");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export const fmt = (n: number): string => String(Math.round(n * 1e6) / 1e6);
