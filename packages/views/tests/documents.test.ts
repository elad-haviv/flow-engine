import { describe, expect, it } from "vitest";
import { solve } from "../../engine/src";
import { build, type BuildSpec } from "../../engine/tests/support";
import { DEFAULT_BOQ, billOfQuantities, circuitSchedule, priceBoq, type PriceList } from "../src";

const grid = { name: "G", kind: "grid", params: { voltage: 400, shortCircuitPower: 5e6 } };
const brk = { name: "Q1", kind: "breaker", params: { ratedCurrent: 50, breakingCapacity: 10000, clearTime: 0.01 } };
const load = (n: string, power: number) => ({ name: n, kind: "load", params: { power, powerFactor: 0.9 } });
const w = (from: string, to: string, lengthM: number, section = 10) => ({ from, to, lengthM, section });

const feeder: BuildSpec = {
  devices: [grid, brk, load("L1", 15000)],
  wires: [w("G.out", "Q1.in", 0), w("Q1.out", "L1.in", 30)],
};
const solved = (spec: BuildSpec) => {
  const b = build(spec);
  return { p: b.project, r: solve(b.project, { profile: "il" }), b };
};

describe("circuit schedule", () => {
  it("one row per consumer with protective device, cable, current, drop and fault level", () => {
    const { p, r } = solved(feeder);
    const rows = circuitSchedule(p, r);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.name).toBe("L1");
    expect(row.protective).toMatchObject({ name: "Q1", ratedA: 50 });
    expect(row.cable).toEqual({ material: "Cu", insulation: "PVC", sectionMm2: 10, lengthM: 30, conductors: 1 });
    expect(row.currentA).toBeGreaterThan(20);
    expect(row.currentA).toBeLessThan(30);
    expect(row.powerW).toBe(15000);
    expect(row.dropPercent).toBeGreaterThan(0);
    expect(row.faultA).toBeGreaterThan(3000);
    expect(row.cableOk).toBe(true);
  });
  it("finds the protective device through a busbar and leaves it empty when there is none", () => {
    const viaBus: BuildSpec = {
      devices: [grid, brk, { name: "B", kind: "busbar", params: {} }, load("L1", 10000), load("L2", 10000)],
      wires: [w("G.out", "Q1.in", 0), w("Q1.out", "B.bus", 5), w("B.bus", "L1.in", 10), w("B.bus", "L2.in", 10)],
    };
    const { p, r } = solved(viaBus);
    expect(circuitSchedule(p, r).map((x) => x.protective?.name)).toEqual(["Q1", "Q1"]);
    const bare = solved({ devices: [grid, load("L1", 1000)], wires: [w("G.out", "L1.in", 10)] });
    expect(circuitSchedule(bare.p, bare.r)[0]!.protective).toBeUndefined();
  });
  it("keeps values absent when the engine produced none (open breaker)", () => {
    const open = solved({ ...feeder, devices: [grid, { ...brk, state: "open" as const }, load("L1", 1000)] });
    const row = circuitSchedule(open.p, open.r)[0]!;
    expect(row.voltageV).toBeUndefined();
    expect(row.cableOk).toBeUndefined();
  });
});

describe("bill of quantities", () => {
  it("counts devices by kind and attributes, cables with allowances, and assembly items", () => {
    const { p } = solved({
      devices: [grid, brk, { ...brk, name: "Q2" }, load("L1", 1000), load("L2", 1000)],
      wires: [w("G.out", "Q1.in", 0), w("Q1.out", "L1.in", 30), w("G.out", "Q2.in", 0), w("Q2.out", "L2.in", 20)],
    });
    const lines = billOfQuantities(p);
    const breaker = lines.find((l) => l.what === "breaker")!;
    expect(breaker).toMatchObject({ quantity: 2, unit: "pc", attrs: { ratedCurrent: 50, breakingCapacity: 10000 } });
    const cable = lines.find((l) => l.what === "cable" && l.attrs["sectionMm2"] === 10)!;
    expect(cable.unit).toBe("m");
    // two cables with length > 0 (30 m and 20 m) and two zero-length ones: (L + 2 * slack) * 1.05 each
    expect(cable.quantity).toBeCloseTo((30 + 2 + (20 + 2) + 2 + 2) * 1.05, 6);
    expect(cable.note).toMatchObject({
      slackPerEndM: DEFAULT_BOQ.slackPerEndM,
      sparePercent: DEFAULT_BOQ.sparePercent,
    });
    expect(lines.find((l) => l.what === "label")!.quantity).toBe(2);
    expect(lines.find((l) => l.what === "cable_lug")!.quantity).toBe(2 * 4);
    expect(lines.some((l) => l.what === "grid" || l.what === "load")).toBe(false);
  });
  it("allowance settings change the length", () => {
    const { p } = solved(feeder);
    const a = billOfQuantities(p, { slackPerEndM: 0, sparePercent: 0 }).find(
      (l) => l.what === "cable" && (l.note?.lengthM ?? 0) > 0,
    )!;
    expect(a.quantity).toBe(30);
  });
  it("a cable no wire uses is not counted", () => {
    const { p } = solved(feeder);
    const orphan = { ...p, wires: [] };
    expect(billOfQuantities(orphan).some((l) => l.what === "cable")).toBe(false);
  });
});

describe("pricing", () => {
  const lists: PriceList[] = [
    {
      name: "Supplier A",
      items: [
        {
          key: "breaker|ratedCurrent=50|breakingCapacity=10000",
          description: "MCB",
          unit: "pc",
          price: 100,
          currency: "ILS",
        },
      ],
    },
  ];
  it("prices from a list, from a manual entry, leaves the rest unpriced, and applies the discount", () => {
    const { p } = solved(feeder);
    const lines = billOfQuantities(p);
    const cableKey = lines.find((l) => l.what === "cable" && (l.note?.lengthM ?? 0) > 0)!.key;
    const r = priceBoq(lines, lists, { [cableKey]: 2 }, 10);
    const brk = r.lines.find((x) => x.line.what === "breaker")!;
    expect(brk).toMatchObject({ unitPrice: 100, total: 100, source: { type: "list", list: "Supplier A" } });
    const cab = r.lines.find((x) => x.line.key === cableKey)!;
    expect(cab.source).toEqual({ type: "manual" });
    expect(cab.total).toBeCloseTo(2 * cab.line.quantity, 2);
    expect(r.totals.unpricedLines).toBe(r.lines.length - 2);
    expect(r.totals.afterDiscount).toBeCloseTo(r.totals.pricedTotal * 0.9, 2);
    expect(r.totals.currencies).toEqual(["ILS"]);
    expect(r.lines.some((x) => x.total === undefined)).toBe(true);
  });
  it("a manual price beats a list price", () => {
    const { p } = solved(feeder);
    const lines = billOfQuantities(p);
    const key = lines.find((l) => l.what === "breaker")!.key;
    expect(priceBoq(lines, lists, { [key]: 80 }, 0).lines.find((x) => x.line.key === key)!.unitPrice).toBe(80);
  });
});

describe("more cases", () => {
  it("a consumer fed by two wires has no single feed cable, and a switch in the path is walked through", () => {
    const two = solved({
      devices: [grid, load("L1", 1000)],
      wires: [w("G.out", "L1.in", 10), w("G.out", "L1.in", 12)],
    });
    const row = circuitSchedule(two.p, two.r)[0]!;
    expect(row.cable).toBeUndefined();
    const chain = solved({
      devices: [grid, brk, { name: "K1", kind: "contactor", params: { ratedCurrent: 63 } }, load("L1", 1000)],
      wires: [w("G.out", "Q1.in", 0), w("Q1.out", "K1.in", 5), w("K1.out", "L1.in", 5)],
    });
    expect(circuitSchedule(chain.p, chain.r)[0]!.protective?.name).toBe("Q1");
  });
  it("a consumer with no wire at all still gets a row", () => {
    const alone = solved({ devices: [grid, load("L1", 1000)], wires: [] });
    expect(circuitSchedule(alone.p, alone.r)).toHaveLength(1);
  });
  it("the same cable size on several wires adds up lengths; a device missing an attribute still counts", () => {
    const s = solved({
      devices: [grid, load("A", 1000), load("B", 1000), { name: "T", kind: "transformer", params: {} }],
      wires: [w("G.out", "A.in", 10), w("G.out", "B.in", 20)],
    });
    const lines = billOfQuantities(s.p, { slackPerEndM: 0, sparePercent: 0 });
    expect(lines.find((l) => l.what === "cable")!.note?.lengthM).toBe(30);
    expect(lines.find((l) => l.what === "transformer")!.attrs).toEqual({});
  });
  it("the first list that has a key wins, and a missing list leaves the line unpriced", () => {
    const s = solved(feeder);
    const lines = billOfQuantities(s.p);
    const key = lines.find((l) => l.what === "breaker")!.key;
    const a: PriceList = { name: "A", items: [{ key, description: "", unit: "pc", price: 5, currency: "ILS" }] };
    const b: PriceList = { name: "B", items: [{ key, description: "", unit: "pc", price: 9, currency: "USD" }] };
    expect(priceBoq(lines, [a, b], {}, 0).lines.find((x) => x.line.key === key)!.unitPrice).toBe(5);
    expect(priceBoq(lines, [], {}, 0).totals.unpricedLines).toBe(lines.length);
  });
});
