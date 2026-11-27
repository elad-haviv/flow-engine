import type { ComponentDef, ParamSpec } from "./types";

const req = (name: string, unit: ParamSpec["unit"], extra: Partial<ParamSpec> = {}): ParamSpec => ({ name, unit, required: true, ...extra });
const opt = (name: string, unit: ParamSpec["unit"], def: number | string, extra: Partial<ParamSpec> = {}): ParamSpec => ({ name, unit, required: false, default: def, ...extra });
const system = (): ParamSpec => ({ name: "system", unit: "text", required: false, options: ["ac3", "ac1", "dc"] });
const AC = ["ac3", "ac1"] as const;
const ANY = ["ac3", "ac1", "dc"] as const;

const sources: ComponentDef[] = [
  { kind: "grid", category: "source", systems: [...AC], terminals: ["out"], params: [system(), req("voltage", "V"), req("shortCircuitPower", "VA"), opt("rxRatio", "ratio", 0.1)] },
  { kind: "generator", category: "source", systems: [...AC], terminals: ["out"], params: [system(), req("ratedPower", "VA"), req("voltage", "V"), opt("powerFactor", "ratio", 0.8), opt("xdSubtransient", "ratio", 0.15)] },
  { kind: "battery", category: "source", systems: ["dc"], terminals: ["out"], params: [req("voltage", "V"), opt("ratedPower", "W", 0)] },
  { kind: "solar_array", category: "source", systems: ["dc"], terminals: ["out"], params: [req("voltage", "V"), req("ratedPower", "W")] },
];

const switches: ComponentDef[] = [
  { kind: "breaker", category: "switch", systems: [...ANY], terminals: ["in", "out"], states: ["closed", "open"], protective: true, params: [system(), req("ratedCurrent", "A"), req("breakingCapacity", "A"), opt("i2Factor", "ratio", 1.45), opt("clearTime", "s", 0.1)] },
  { kind: "fuse", category: "switch", systems: [...ANY], terminals: ["in", "out"], states: ["closed", "open"], protective: true, params: [system(), req("ratedCurrent", "A"), req("breakingCapacity", "A"), opt("i2Factor", "ratio", 1.6), opt("clearTime", "s", 0.1)] },
  { kind: "contactor", category: "switch", systems: [...ANY], terminals: ["in", "out"], states: ["closed", "open"], params: [system(), req("ratedCurrent", "A")] },
  { kind: "disconnector", category: "switch", systems: [...ANY], terminals: ["in", "out"], states: ["closed", "open"], params: [system(), opt("ratedCurrent", "A", 0)] },
  { kind: "meter", category: "switch", systems: [...ANY], terminals: ["in", "out"], params: [system()] },
  { kind: "earthing_disconnector", category: "earthing", systems: [...ANY], terminals: ["in"], states: ["open", "grounded"], params: [system()] },
  { kind: "busbar", category: "busbar", systems: [...ANY], terminals: ["bus"], params: [system(), opt("ratedCurrent", "A", 0)] },
];

const network: ComponentDef[] = [
  { kind: "transformer", category: "transformer", systems: [...AC], terminals: ["in", "out"], params: [system(), req("ratedPower", "VA"), req("primaryVoltage", "V"), req("secondaryVoltage", "V"), req("ukPercent", "percent"), opt("prPercent", "percent", 1)] },
  { kind: "rectifier", category: "converter", systems: ["ac3"], terminals: ["in", "out"], params: [req("outputVoltage", "V"), opt("efficiency", "ratio", 0.95), opt("powerFactor", "ratio", 0.95)] },
  { kind: "inverter", category: "converter", systems: ["dc"], terminals: ["in", "out"], params: [req("outputVoltage", "V"), opt("efficiency", "ratio", 0.95), { name: "outputSystem", unit: "text", required: false, default: "ac3", options: ["ac3", "ac1"] }] },
  { kind: "cc_regulator", category: "converter", systems: ["ac3", "ac1"], terminals: ["in", "out", "return"], params: [req("current", "A"), req("maxVoltage", "V"), opt("efficiency", "ratio", 0.9), opt("powerFactor", "ratio", 0.9)] },
];

const loads: ComponentDef[] = [
  { kind: "load", category: "load", systems: [...ANY], terminals: ["in"], params: [system(), req("power", "W"), opt("powerFactor", "ratio", 0.9), { name: "voltage", unit: "V", required: false }] },
  { kind: "motor", category: "load", systems: [...AC], terminals: ["in"], params: [system(), req("power", "W"), opt("efficiency", "ratio", 0.9), opt("powerFactor", "ratio", 0.85), { name: "voltage", unit: "V", required: false }] },
  { kind: "capacitor", category: "load", systems: [...AC], terminals: ["in"], params: [system(), req("reactivePower", "var"), { name: "voltage", unit: "V", required: false }] },
  { kind: "series_load", category: "series", systems: ["loop"], terminals: ["in", "out"], params: [req("voltage", "V")] },
];

export const DEFINITIONS: ComponentDef[] = [...sources, ...switches, ...network, ...loads];
