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
  /** Switches that may be opened with current flowing (breakers, contactors); isolators may not */
  breaksLoad?: boolean;
  /** Which parameter gives the nominal voltage at a terminal. */
  terminalVoltage?: Partial<Record<TerminalRole, string>>;
  /** Power system of the device's output side (converters). */
  outputSystem?: PowerSystem;
  /** Parameter that selects the output system, when it is a choice. */
  outputSystemParam?: string;
  /** Sources: slack fixes the voltage; pq injects the power it is set to. */
  sourceRole?: "slack" | "pq";
  /** Power taken from the network in watts and var. `outputW` is the power drawn on the output side of a converter. */
  demand?: (p: Params, outputW: number) => { p: number; q: number };
  /** Power injected by a pq source. */
  supply?: (p: Params) => { p: number; q: number };
  /** Short-circuit source impedance in ohm, referred to `vBase` volts, for voltage factor `c`. */
  sourceImpedance?: (p: Params, vBase: number, c: number, cMax: number) => { r: number; x: number };
  /** Series impedance of a transformer in per unit on its own rating, with its rating and its two nominal voltages. */
  seriesImpedance?: (p: Params) => { r: number; x: number; ratedVA: number; primaryV: number; secondaryV: number };
}

export type Params = Record<string, number | string>;
