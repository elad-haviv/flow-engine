import { describe, expect, it } from "vitest";
import { switchingPlan, type SwitchingPlan } from "../src";
import { build, type BuildSpec } from "./support";

const grid = { name: "G", kind: "grid", params: { voltage: 400, shortCircuitPower: 5e6 } };
const brk = (n: string) => ({
  name: n,
  kind: "breaker",
  params: { ratedCurrent: 63, breakingCapacity: 20000, clearTime: 0.01 },
});
const dis = (n: string) => ({ name: n, kind: "disconnector", params: {} });
const earth = { name: "E1", kind: "earthing_disconnector", params: {} };
const load = (n: string) => ({ name: n, kind: "load", params: { power: 5000, powerFactor: 0.9 } });
const w = (from: string, to: string, lengthM = 5) => ({ from, to, lengthM, section: 10 });

const plan = (spec: BuildSpec, targets: string[]): { p: SwitchingPlan; names: (id?: string) => string | undefined } => {
  const b = build(spec);
  const rev = new Map([...b.deviceIds].map(([k, v]) => [v, k]));
  return {
    p: switchingPlan(
      b.project,
      targets.map((n) => b.deviceIds.get(n)!),
    ),
    names: (id) => (id ? rev.get(id) : undefined),
  };
};
const describe_ = (r: ReturnType<typeof plan>) =>
  r.p.isolate.map((s) => `${s.action}${s.deviceId ? ":" + r.names(s.deviceId) : ""}`);

const feeder: BuildSpec = {
  devices: [
    grid,
    brk("Q1"),
    dis("QS1"),
    { name: "B", kind: "busbar", params: {} },
    brk("Q2"),
    load("L1"),
    brk("Q3"),
    load("L2"),
    earth,
  ],
  wires: [
    w("G.out", "Q1.in", 0),
    w("Q1.out", "QS1.in", 2),
    w("QS1.out", "B.bus", 2),
    w("B.bus", "Q2.in", 2),
    w("Q2.out", "L1.in", 8),
    w("B.bus", "Q3.in", 2),
    w("Q3.out", "L2.in", 8),
    w("L1.in", "E1.in", 1),
  ],
};

describe("switching plan", () => {
  it("isolates a feeder: open its breaker, lock, prove dead, earth; restore in reverse", () => {
    const r = plan(feeder, ["L1"]);
    expect(describe_(r)).toEqual(["open:Q2", "lock:Q2", "verify_dead", "earth:E1"]);
    expect(r.p.violations).toEqual([]);
    expect(r.p.restore.map((s) => `${s.action}${s.deviceId ? ":" + r.names(s.deviceId) : ""}`)).toEqual([
      "unearth:E1",
      "verify_earth_open",
      "unlock:Q2",
      "close:Q2",
    ]);
    expect(r.p.boundary.map((id) => r.names(id))).toEqual(["Q2"]);
  });
  it("without an earthing point it says so", () => {
    const noEarth = {
      ...feeder,
      devices: feeder.devices.filter((d) => d.name !== "E1"),
      wires: feeder.wires.slice(0, -1),
    };
    const r = plan(noEarth, ["L1"]);
    expect(r.p.violations.map((v) => v.code)).toEqual(["no_isolation_point"]);
    expect(describe_(r)).toEqual(["open:Q2", "lock:Q2", "verify_dead"]);
  });
  it("opens load-breaking devices before isolators when both bound the region, and the isolator is then not under load", () => {
    const spec: BuildSpec = {
      devices: [
        grid,
        dis("QS1"),
        {
          name: "T",
          kind: "transformer",
          params: { ratedPower: 1e6, primaryVoltage: 400, secondaryVoltage: 400, ukPercent: 6 },
        },
        brk("Q2"),
        load("L1"),
        earth,
      ],
      wires: [
        w("G.out", "QS1.in", 0),
        w("QS1.out", "T.in", 1),
        w("T.out", "Q2.in", 1),
        w("Q2.out", "L1.in", 5),
        w("T.out", "E1.in", 1),
      ],
    };
    const r = plan(spec, ["T"]);
    expect(describe_(r)).toEqual(["open:Q2", "open:QS1", "lock:Q2", "lock:QS1", "verify_dead", "earth:E1"]);
    expect(r.p.violations).toEqual([]);
    expect(r.p.restore.map((s) => `${s.action}${s.deviceId ? ":" + r.names(s.deviceId) : ""}`)).toEqual([
      "unearth:E1",
      "verify_earth_open",
      "unlock:QS1",
      "unlock:Q2",
      "close:QS1",
      "close:Q2",
    ]);
  });
  it("flags an isolator that would be opened under load", () => {
    const spec: BuildSpec = {
      devices: [grid, dis("QS1"), load("L1"), earth],
      wires: [w("G.out", "QS1.in", 0), w("QS1.out", "L1.in", 5), w("L1.in", "E1.in", 1)],
    };
    const r = plan(spec, ["L1"]);
    expect(r.p.violations.map((v) => v.code)).toContain("open_under_load");
  });
  it("flags a region that stays live because a source sits inside it", () => {
    const r = plan(feeder, ["G"]);
    expect(r.p.violations.map((v) => v.code)).toContain("still_live");
  });
  it("skips switches that are already open", () => {
    const spec = {
      ...feeder,
      devices: feeder.devices.map((d) => (d.name === "Q2" ? { ...d, state: "open" as const } : d)),
    };
    const r = plan(spec, ["L1"]);
    expect(describe_(r)).toEqual(["verify_dead", "earth:E1"]);
  });
  it("flags earthing a live region", () => {
    const spec: BuildSpec = {
      devices: [grid, load("L1"), earth],
      wires: [w("G.out", "L1.in", 5), w("L1.in", "E1.in", 1)],
    };
    const r = plan(spec, ["L1"]);
    expect(r.p.violations.map((v) => v.code)).toEqual(expect.arrayContaining(["still_live", "earth_on_live"]));
  });
});
