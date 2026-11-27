import type { ComponentDef, ParamSpec } from "./types";

const req = (name: string, unit: ParamSpec["unit"], extra: Partial<ParamSpec> = {}): ParamSpec => ({
  name,
  unit,
  required: true,
  ...extra,
});
const opt = (
  name: string,
  unit: ParamSpec["unit"],
  def: number | string,
  extra: Partial<ParamSpec> = {},
): ParamSpec => ({ name, unit, required: false, default: def, ...extra });
const system = (): ParamSpec => ({ name: "system", unit: "text", required: false, options: ["ac3", "ac1", "dc"] });
const rated = (): ParamSpec => ({ name: "voltage", unit: "V", required: false });
const AC = ["ac3", "ac1"] as const;
const ANY = ["ac3", "ac1", "dc"] as const;
const tan = (pf: number): number => Math.tan(Math.acos(Math.min(1, Math.max(1e-9, pf))));
const n = (v: number | string | undefined): number => v as number;

const sources: ComponentDef[] = [
  {
    kind: "grid",
    category: "source",
    systems: [...AC],
    terminals: ["out"],
    terminalVoltage: { out: "voltage" },
    sourceRole: "slack",
    params: [system(), req("voltage", "V"), req("shortCircuitPower", "VA"), opt("rxRatio", "ratio", 0.1)],
    sourceImpedance: (p, vBase, c) => {
      const z = (c * vBase * vBase) / n(p["shortCircuitPower"]);
      const x = z / Math.sqrt(1 + n(p["rxRatio"]) ** 2);
      return { r: n(p["rxRatio"]) * x, x };
    },
  },
  {
    kind: "generator",
    category: "source",
    systems: [...AC],
    terminals: ["out"],
    terminalVoltage: { out: "voltage" },
    sourceRole: "pq",
    params: [
      system(),
      req("ratedPower", "VA"),
      req("voltage", "V"),
      opt("powerFactor", "ratio", 0.8),
      opt("xdSubtransient", "ratio", 0.15),
    ],
    supply: (p) => {
      const pw = n(p["ratedPower"]) * n(p["powerFactor"]);
      return { p: pw, q: pw * tan(n(p["powerFactor"])) };
    },
    sourceImpedance: (p, vBase, _c, cMax) => {
      const xd = n(p["xdSubtransient"]);
      const zg = (xd * n(p["voltage"]) ** 2) / n(p["ratedPower"]);
      const sinPhi = Math.sqrt(1 - Math.min(1, n(p["powerFactor"])) ** 2);
      const kg = (vBase / n(p["voltage"])) * (cMax / (1 + xd * sinPhi));
      const rRatio = n(p["voltage"]) <= 1000 ? 0.15 : 0.07;
      const x = (kg * zg) / Math.sqrt(1 + rRatio ** 2);
      return { r: rRatio * x, x };
    },
  },
  {
    kind: "battery",
    category: "source",
    systems: ["dc"],
    terminals: ["out"],
    terminalVoltage: { out: "voltage" },
    sourceRole: "slack",
    params: [req("voltage", "V"), opt("ratedPower", "W", 0)],
  },
  {
    kind: "solar_array",
    category: "source",
    systems: ["dc"],
    terminals: ["out"],
    terminalVoltage: { out: "voltage" },
    sourceRole: "slack",
    params: [req("voltage", "V"), req("ratedPower", "W")],
  },
];

const switches: ComponentDef[] = [
  {
    kind: "breaker",
    category: "switch",
    systems: [...ANY],
    terminals: ["in", "out"],
    breaksLoad: true,
    states: ["closed", "open"],
    protective: true,
    params: [
      system(),
      req("ratedCurrent", "A"),
      req("breakingCapacity", "A"),
      opt("i2Factor", "ratio", 1.45),
      opt("clearTime", "s", 0.1),
    ],
  },
  {
    kind: "fuse",
    category: "switch",
    systems: [...ANY],
    terminals: ["in", "out"],
    states: ["closed", "open"],
    protective: true,
    params: [
      system(),
      req("ratedCurrent", "A"),
      req("breakingCapacity", "A"),
      opt("i2Factor", "ratio", 1.6),
      opt("clearTime", "s", 0.1),
    ],
  },
  {
    kind: "contactor",
    category: "switch",
    systems: [...ANY],
    terminals: ["in", "out"],
    breaksLoad: true,
    states: ["closed", "open"],
    params: [system(), req("ratedCurrent", "A")],
  },
  {
    kind: "disconnector",
    category: "switch",
    systems: [...ANY],
    terminals: ["in", "out"],
    states: ["closed", "open"],
    params: [system(), opt("ratedCurrent", "A", 0)],
  },
  { kind: "meter", category: "switch", systems: [...ANY], terminals: ["in", "out"], params: [system()] },
  {
    kind: "earthing_disconnector",
    category: "earthing",
    systems: [...ANY],
    terminals: ["in"],
    states: ["open", "grounded"],
    params: [system()],
  },
  {
    kind: "busbar",
    category: "busbar",
    systems: [...ANY],
    terminals: ["bus"],
    params: [system(), opt("ratedCurrent", "A", 0)],
  },
];

const network: ComponentDef[] = [
  {
    kind: "transformer",
    category: "transformer",
    systems: [...AC],
    terminals: ["in", "out"],
    terminalVoltage: { in: "primaryVoltage", out: "secondaryVoltage" },
    params: [
      system(),
      req("ratedPower", "VA"),
      req("primaryVoltage", "V"),
      req("secondaryVoltage", "V"),
      req("ukPercent", "percent"),
      opt("prPercent", "percent", 1),
    ],
    seriesImpedance: (p) => {
      const uk = n(p["ukPercent"]) / 100;
      const ur = n(p["prPercent"]) / 100;
      return {
        r: ur,
        x: Math.sqrt(Math.max(0, uk * uk - ur * ur)),
        ratedVA: n(p["ratedPower"]),
        primaryV: n(p["primaryVoltage"]),
        secondaryV: n(p["secondaryVoltage"]),
      };
    },
  },
  {
    kind: "rectifier",
    category: "converter",
    systems: ["ac3"],
    terminals: ["in", "out"],
    terminalVoltage: { out: "outputVoltage" },
    outputSystem: "dc",
    params: [req("outputVoltage", "V"), opt("efficiency", "ratio", 0.95), opt("powerFactor", "ratio", 0.95)],
    demand: (p, w) => {
      const pin = w / n(p["efficiency"]);
      return { p: pin, q: pin * tan(n(p["powerFactor"])) };
    },
  },
  {
    kind: "inverter",
    category: "converter",
    systems: ["dc"],
    terminals: ["in", "out"],
    terminalVoltage: { out: "outputVoltage" },
    outputSystemParam: "outputSystem",
    params: [
      req("outputVoltage", "V"),
      opt("efficiency", "ratio", 0.95),
      { name: "outputSystem", unit: "text", required: false, default: "ac3", options: ["ac3", "ac1"] },
    ],
    demand: (p, w) => ({ p: w / n(p["efficiency"]), q: 0 }),
  },
  {
    kind: "cc_regulator",
    category: "converter",
    systems: [...AC],
    terminals: ["in", "out", "return"],
    outputSystem: "loop",
    params: [
      system(),
      req("current", "A"),
      req("maxVoltage", "V"),
      opt("efficiency", "ratio", 0.9),
      opt("powerFactor", "ratio", 0.9),
    ],
    demand: (p, w) => {
      const pin = w / n(p["efficiency"]);
      return { p: pin, q: pin * tan(n(p["powerFactor"])) };
    },
  },
];

const loads: ComponentDef[] = [
  {
    kind: "load",
    category: "load",
    systems: [...ANY],
    terminals: ["in"],
    params: [system(), req("power", "W"), opt("powerFactor", "ratio", 0.9), rated()],
    demand: (p) => ({ p: n(p["power"]), q: n(p["power"]) * tan(n(p["powerFactor"])) }),
  },
  {
    kind: "motor",
    category: "load",
    systems: [...AC],
    terminals: ["in"],
    params: [system(), req("power", "W"), opt("efficiency", "ratio", 0.9), opt("powerFactor", "ratio", 0.85), rated()],
    demand: (p) => {
      const pin = n(p["power"]) / n(p["efficiency"]);
      return { p: pin, q: pin * tan(n(p["powerFactor"])) };
    },
  },
  {
    kind: "capacitor",
    category: "load",
    systems: [...AC],
    terminals: ["in"],
    params: [system(), req("reactivePower", "var"), rated()],
    demand: (p) => ({ p: 0, q: -n(p["reactivePower"]) }),
  },
  {
    kind: "series_load",
    category: "series",
    systems: ["loop"],
    terminals: ["in", "out"],
    params: [req("voltage", "V")],
  },
];

export const DEFINITIONS: ComponentDef[] = [...sources, ...switches, ...network, ...loads];
