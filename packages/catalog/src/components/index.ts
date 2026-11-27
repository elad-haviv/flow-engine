import type { ParamValue } from "@flow/model";
import { DEFINITIONS } from "./definitions";
import type { ComponentDef, ParamSpec } from "./types";

export * from "./types";
export { DEFINITIONS };

const byKind = new Map(DEFINITIONS.map((d) => [d.kind, d]));
export const getComponent = (kind: string): ComponentDef | undefined => byKind.get(kind);

const numberOf = (v: ParamValue): number | undefined => (typeof v === "number" ? v : typeof v === "object" ? v.v : undefined);

/** Whether a value fits the parameter's spec (type, range, options). */
export function paramValid(kind: string, field: string, value: ParamValue): boolean {
  const spec: ParamSpec | undefined = byKind.get(kind)?.params.find((p) => p.name === field);
  if (!spec) return false;
  if (spec.unit === "text") return typeof value === "string" && (!spec.options || spec.options.includes(value));
  const n = numberOf(value);
  if (n === undefined || !Number.isFinite(n)) return false;
  if (spec.min !== undefined && n < spec.min) return false;
  if (spec.max !== undefined && n > spec.max) return false;
  return true;
}

export const stateValid = (kind: string, state: string): boolean =>
  (byKind.get(kind)?.states as string[] | undefined)?.includes(state) ?? false;

export const terminalsFor = (kind: string) => byKind.get(kind)?.terminals.map((role) => ({ role, conductors: [] as string[] }));
