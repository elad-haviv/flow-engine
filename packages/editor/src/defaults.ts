import type { ParamValue } from "@flow/model";

/** Language-neutral reference designators (IEC 81346 style), used as starting names: Q1, L2, ... */
export const DESIGNATORS: Record<string, string> = {
  grid: "G",
  generator: "GN",
  battery: "BAT",
  solar_array: "PV",
  breaker: "Q",
  fuse: "F",
  contactor: "K",
  disconnector: "QS",
  meter: "PM",
  earthing_disconnector: "QE",
  busbar: "WA",
  transformer: "T",
  rectifier: "U",
  inverter: "INV",
  cc_regulator: "CCR",
  load: "L",
  motor: "M",
  capacitor: "C",
  series_load: "EL",
};

const q = (v: number, u: "V" | "A" | "W" | "VA" | "var" | "s"): ParamValue => ({ v, u });

/** Values a new device starts with so it calculates at once. They are ordinary entered values the user can change in the form. */
export const STARTER_PARAMS: Record<string, Record<string, ParamValue>> = {
  grid: { voltage: q(400, "V"), shortCircuitPower: q(5e6, "VA") },
  generator: { ratedPower: q(500e3, "VA"), voltage: q(400, "V") },
  battery: { voltage: q(48, "V") },
  solar_array: { voltage: q(48, "V"), ratedPower: q(5000, "W") },
  breaker: { ratedCurrent: q(50, "A"), breakingCapacity: q(10e3, "A"), clearTime: q(0.01, "s") },
  fuse: { ratedCurrent: q(63, "A"), breakingCapacity: q(50e3, "A") },
  contactor: { ratedCurrent: q(63, "A") },
  transformer: { ratedPower: q(1e6, "VA"), primaryVoltage: q(20e3, "V"), secondaryVoltage: q(400, "V"), ukPercent: 6 },
  rectifier: { outputVoltage: q(48, "V") },
  inverter: { outputVoltage: q(230, "V") },
  cc_regulator: { current: q(6.6, "A"), maxVoltage: q(300, "V") },
  load: { power: q(10e3, "W") },
  motor: { power: q(7.5e3, "W") },
  capacitor: { reactivePower: q(5e3, "var") },
  series_load: { voltage: q(30, "V") },
};

export const DEFAULT_CABLE = { lengthM: 10, installation: "C", sectionMm2: 10 } as const;
export const ROLE_OF_SYSTEM = { ac3: "L1", ac1: "L", dc: "DC+", loop: "L" } as const;
