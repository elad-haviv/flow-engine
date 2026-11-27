import type { ParamValue } from "@flow/model";

export type PowerSystem = "ac3" | "ac1" | "dc" | "loop";
export type Category = "source" | "load" | "switch" | "busbar" | "transformer" | "converter" | "earthing" | "series";
export type TerminalRole = "in" | "out" | "return" | "earth" | "bus";
export type ParamUnit = "V" | "A" | "W" | "VA" | "var" | "s" | "ratio" | "percent" | "text";

export interface ParamSpec {
  name: string;
  unit: ParamUnit;
  required: boolean;
  /** Used when the value is missing and not required. The engine reports every use of a default. */
  default?: number | string;
  options?: string[];
  min?: number;
  max?: number;
}

export interface ComponentDef {
  kind: string;
  category: Category;
  /** Power systems the device can work in; the first is the default for a source. */
  systems: PowerSystem[];
  terminals: TerminalRole[];
  params: ParamSpec[];
  /** Switches only: which states the device supports. */
  states?: Array<"closed" | "open" | "grounded">;
  /** True for devices that protect a cable (breaker, fuse). */
  protective?: boolean;
}

export type Params = Record<string, ParamValue>;
