import { expect, it } from "vitest";
import { solve } from "../src";
import { build, type BuildSpec } from "./support";

/** 1 grid, 1 transformer, 1 main busbar, 10 feeders (breaker, cable, busbar), 40 loads per feeder: about 500 devices. */
function sample(): BuildSpec {
  const devices: BuildSpec["devices"] = [
    { name: "G", kind: "grid", params: { voltage: 20000, shortCircuitPower: 250e6 } },
    {
      name: "T",
      kind: "transformer",
      params: { ratedPower: 2.5e6, primaryVoltage: 20000, secondaryVoltage: 400, ukPercent: 6 },
    },
    { name: "M", kind: "busbar", params: {} },
  ];
  const wires: BuildSpec["wires"] = [
    { from: "G.out", to: "T.in", lengthM: 0, section: 95 },
    { from: "T.out", to: "M.bus", lengthM: 0, section: 95 },
  ];
  for (let f = 0; f < 10; f++) {
    devices.push(
      { name: `Q${f}`, kind: "breaker", params: { ratedCurrent: 200, breakingCapacity: 80000, clearTime: 0.01 } },
      { name: `B${f}`, kind: "busbar", params: {} },
    );
    wires.push(
      { from: "M.bus", to: `Q${f}.in`, lengthM: 0, section: 95 },
      { from: `Q${f}.out`, to: `B${f}.bus`, lengthM: 20, section: 95 },
    );
    for (let l = 0; l < 40; l++) {
      devices.push({ name: `L${f}_${l}`, kind: "load", params: { power: 1500, powerFactor: 0.9 } });
      wires.push({ from: `B${f}.bus`, to: `L${f}_${l}.in`, lengthM: 15 + l, section: 4 });
    }
  }
  return { devices, wires };
}

it("solves a sample project of about 500 devices in under one second", () => {
  const spec = sample();
  expect(spec.devices.length).toBeGreaterThanOrEqual(420);
  const p = build(spec).project;
  const t0 = performance.now();
  const r = solve(p, { profile: "il" });
  const ms = performance.now() - t0;
  console.log(`engine solve ms=${Math.round(ms)} devices=${p.devices.length} nodes=${r.nodes.length}`);
  expect(r.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  expect(r.loads).toHaveLength(400);
  expect(ms).toBeLessThan(1000);
});
