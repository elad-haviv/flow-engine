import { describe, expect, it } from "vitest";
import { solve } from "../src";
import { build, type BuildSpec } from "./support";

const g = { name: "G", kind: "grid", params: { voltage: 400, shortCircuitPower: 1e9 } };
const load = (name: string) => ({ name, kind: "load", params: { power: 1000, powerFactor: 1 } });
const wire = (from: string, to: string, lengthM = 10) => ({ from, to, lengthM, section: 10 });
const codes = (spec: BuildSpec, profile: "il" | "iec" = "il") =>
  solve(build(spec).project, { profile }).diagnostics.map((d) => d.code);

describe("advice and validation", () => {
  it("suggests a busbar at three wires on one terminal, not at two", () => {
    const three = {
      devices: [g, load("A"), load("B"), load("C")],
      wires: [wire("G.out", "A.in"), wire("G.out", "B.in"), wire("G.out", "C.in")],
    };
    expect(codes(three)).toContain("advice.busbar.suggest");
    expect(codes({ ...three, wires: three.wires.slice(0, 2) })).not.toContain("advice.busbar.suggest");
  });
  it("does not suggest a busbar on a busbar", () => {
    const bus = {
      devices: [g, { name: "BB", kind: "busbar", params: {} }, load("A"), load("B"), load("C")],
      wires: [wire("G.out", "BB.bus"), wire("BB.bus", "A.in"), wire("BB.bus", "B.in"), wire("BB.bus", "C.in")],
    };
    expect(codes(bus)).not.toContain("advice.busbar.suggest");
  });
  it("reports a missing required parameter and stops", () => {
    const r = solve(build({ devices: [{ name: "G", kind: "grid", params: { voltage: 400 } }], wires: [] }).project, {
      profile: "il",
    });
    expect(r.diagnostics.map((d) => d.code)).toContain("engine.param.missing");
    expect(r.nodes).toEqual([]);
  });
  it("reports defaulted parameters instead of using them silently", () => {
    expect(codes({ devices: [g, load("A")], wires: [wire("G.out", "A.in")] })).toContain("engine.param.defaulted");
  });
  it("reports a voltage conflict between joined networks without a transformer", () => {
    const spec = {
      devices: [g, { name: "H", kind: "grid", params: { voltage: 20000, shortCircuitPower: 1e9 } }],
      wires: [wire("G.out", "H.out")],
    };
    expect(codes(spec)).toContain("engine.voltage.conflict");
  });
  it("rejects a rectifier fed from a single-phase network", () => {
    const spec = {
      devices: [
        { name: "G", kind: "grid", params: { system: "ac1", voltage: 230, shortCircuitPower: 1e8 } },
        { name: "R", kind: "rectifier", params: { outputVoltage: 48 } },
      ],
      wires: [wire("G.out", "R.in")],
    };
    expect(codes(spec)).toContain("engine.converter.input_system");
  });
  it("warns when a load drops below the profile limit and when the rating differs", () => {
    const spec = {
      devices: [g, { name: "L", kind: "load", params: { power: 150000, powerFactor: 0.9, voltage: 230 } }],
      wires: [{ from: "G.out", to: "L.in", lengthM: 200, section: 10 }],
    };
    const c = codes(spec);
    expect(c).toContain("engine.voltage.drop_exceeded");
    expect(c).toContain("engine.voltage.rating_mismatch");
  });
  it("warns when a breaker cannot break the fault current", () => {
    const spec = {
      devices: [
        { name: "G", kind: "grid", params: { voltage: 400, shortCircuitPower: 50e6 } },
        { name: "BR", kind: "breaker", params: { ratedCurrent: 63, breakingCapacity: 6000 } },
        load("A"),
      ],
      wires: [wire("G.out", "BR.in", 0), wire("BR.out", "A.in")],
    };
    expect(codes(spec)).toContain("engine.protection.breaking_capacity_exceeded");
  });
  it("warns about an earthing disconnector closed on a live part", () => {
    const spec = {
      devices: [g, { name: "E", kind: "earthing_disconnector", params: {}, state: "grounded" as const }],
      wires: [wire("G.out", "E.in")],
    };
    expect(codes(spec)).toContain("engine.net.earthed_live");
  });
  it("reports an open loop and a loop that needs more voltage than the regulator gives", () => {
    const loop = (maxV: number, close: boolean) => ({
      devices: [
        g,
        { name: "R", kind: "cc_regulator", params: { current: 6.6, maxVoltage: maxV } },
        { name: "S", kind: "series_load", params: { voltage: 100 } },
      ],
      wires: [
        wire("G.out", "R.in", 0),
        { from: "R.out", to: "S.in", lengthM: 10, section: 6, role: "L" },
        ...(close ? [{ from: "S.out", to: "R.return", lengthM: 10, section: 6, role: "L" }] : []),
      ],
    });
    expect(codes(loop(300, false))).toContain("engine.loop.open");
    expect(codes(loop(50, true))).toContain("engine.loop.voltage_exceeds_regulator");
  });
  it("handles a two-stage converter chain (rectifier then inverter) and both profiles", () => {
    const spec = {
      devices: [
        g,
        { name: "R", kind: "rectifier", params: { outputVoltage: 48 } },
        { name: "I", kind: "inverter", params: { outputVoltage: 230, outputSystem: "ac1" } },
        { name: "L", kind: "load", params: { system: "ac1", power: 500, powerFactor: 1 } },
      ],
      wires: [
        wire("G.out", "R.in", 1),
        { from: "R.out", to: "I.in", lengthM: 0, section: 16, role: "DC+" },
        { from: "I.out", to: "L.in", lengthM: 0, section: 4, role: "L" },
      ],
    };
    for (const p of ["il", "iec"] as const) {
      const r = solve(build(spec).project, { profile: p });
      expect(r.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      const grid = r.sources.find((s) => s.activePower.value > 0 && r.islands.length === 3)!;
      expect(grid.activePower.value).toBeCloseTo(500 / 0.95 / 0.95, 0);
    }
  });
});
