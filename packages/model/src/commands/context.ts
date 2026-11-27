import type { Diagnostic } from "../diagnostics/diagnostic";
import type { ParamValue } from "./types";

/** Injected by the caller: catalog knowledge and id/time sources. The model never imports the catalog. */
export interface ApplyContext {
  newId(): string;
  now(): string;
  /** Terminal roles a device kind has, or undefined if the kind is unknown. */
  terminalsFor(kind: string): Array<{ role: "in" | "out" | "earth" | "bus"; conductors: string[] }> | undefined;
  paramValid(kind: string, field: string, value: ParamValue): boolean;
  stateValid(kind: string, state: string): boolean;
}

export type ApplyResult = { ok: true; changes: import("./changes").Change[] } | { ok: false; diagnostic: Diagnostic };
