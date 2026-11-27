import { describe, expect, it } from "vitest";
import { solve } from "../src";
import { build, type BuildSpec } from "./support";

const w = (from: string, to: string, lengthM = 10, role = "L1") => ({ from, to, lengthM, section: 25, role });
const grid = { name: "G", kind: "grid", params: { voltage: 400, shortCircuitPower: 1e9 } };
const gen = { name: "GN", kind: "generator", params: { ratedPower: 500000, voltage: 400, powerFactor: 0.8 } };
const run = (spec: BuildSpec) => solve(build(spec).project, { profile: "il" });

describe("sources and loads", () => {
  it("a generator alone becomes the slack and feeds a load", () => {
    const r = run({
      devices: [gen, { name: "L", kind: "load", params: { power: 40000, powerFactor: 0.9 } }],
      wires: [w("GN.out", "L.in")],
    });
    expect(r.loads).toHaveLength(1);
    expect(r.sources[0]!.activePower.value).toBeGreaterThan(40000);
    expect(r.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });
  it("a generator beside a grid injects its set power", () => {
    const r = run({
      devices: [grid, gen, { name: "L", kind: "load", params: { power: 100000, powerFactor: 0.9 } }],
      wires: [w("G.out", "L.in"), w("GN.out", "L.in")],
    });
    const g = r.sources.find((s) => s.activePower.value === 400000);
    expect(g).toBeDefined();
  });
  it("motor and capacitor loads draw the expected power", () => {
    const r = run({
      devices: [
        grid,
        { name: "M", kind: "motor", params: { power: 9000, efficiency: 0.9, powerFactor: 0.8 } },
        { name: "C", kind: "capacitor", params: { reactivePower: 5000 } },
      ],
      wires: [w("G.out", "M.in"), w("G.out", "C.in")],
    });
    const m = r.loads[0]!;
    expect(m.activePower.value).toBeCloseTo(10000, 6);
    expect(r.loads[1]!.reactivePower.value).toBe(-5000);
  });
});

describe("input problems", () => {
  it("a cable without a phase conductor is an error", () => {
    const r = run({
      devices: [grid, { name: "L", kind: "load", params: { power: 1000, powerFactor: 1 } }],
      wires: [w("G.out", "L.in", 10, "N")],
    });
    expect(r.diagnostics.map((d) => d.code)).toContain("engine.cable.no_phase_conductor");
  });
  it("an unknown device kind is an error and stops the calculation", () => {
    const b = build({ devices: [grid], wires: [] });
    const p = { ...b.project, devices: b.project.devices.map((d) => ({ ...d, kind: "zzz" })) };
    const r = solve(p, { profile: "il" });
    expect(r.diagnostics.map((d) => d.code)).toContain("engine.device.kind_unknown");
    expect(r.nodes).toEqual([]);
  });
  it("series loads outside the loop path are reported", () => {
    const r = run({
      devices: [
        grid,
        { name: "R", kind: "cc_regulator", params: { current: 5, maxVoltage: 500 } },
        { name: "S1", kind: "series_load", params: { voltage: 20 } },
        { name: "S2", kind: "series_load", params: { voltage: 20 } },
      ],
      wires: [
        w("G.out", "R.in", 0),
        w("R.out", "S1.in", 5, "L"),
        w("S1.out", "R.return", 5, "L"),
        w("S1.out", "S2.in", 5, "L"),
      ],
    });
    expect(r.diagnostics.map((d) => d.code)).toContain("engine.loop.branching");
  });
  it("a node with no voltage reference is reported", () => {
    const r = run({
      devices: [
        grid,
        { name: "L", kind: "load", params: { power: 1, powerFactor: 1 } },
        { name: "X", kind: "load", params: { power: 1, powerFactor: 1 } },
      ],
      wires: [w("G.out", "L.in")],
    });
    expect(r.loads).toHaveLength(1);
  });
  it("a single-phase and a DC island report that short circuit is not calculated", () => {
    const r = run({
      devices: [
        { name: "G", kind: "grid", params: { system: "ac1", voltage: 230, shortCircuitPower: 1e8 } },
        { name: "L", kind: "load", params: { power: 100, powerFactor: 1 } },
      ],
      wires: [w("G.out", "L.in", 5, "L")],
    });
    expect(r.diagnostics.map((d) => d.code)).toContain("engine.sc.unsupported_power_type");
  });
});

describe("short circuit with a generator", () => {
  it("warns that far-from-generator is assumed", () => {
    const r = run({ devices: [gen, { name: "B", kind: "busbar", params: {} }], wires: [w("GN.out", "B.bus", 0)] });
    expect(r.diagnostics.map((d) => d.code)).toContain("engine.sc.near_generator");
  });
});
