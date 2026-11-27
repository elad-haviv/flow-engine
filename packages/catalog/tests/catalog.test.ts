import { describe, expect, it } from "vitest";
import {
  DEFINITIONS,
  SECTIONS_MM2,
  ampacity,
  conductors,
  getComponent,
  lookupAmpacity,
  paramValid,
  profiles,
  stateValid,
  terminalsFor,
} from "../src";

describe("components", () => {
  it("has the eight core components and about twenty in total", () => {
    for (const k of [
      "grid",
      "generator",
      "breaker",
      "busbar",
      "transformer",
      "disconnector",
      "earthing_disconnector",
      "load",
    ])
      expect(getComponent(k), k).toBeDefined();
    expect(DEFINITIONS.length).toBeGreaterThanOrEqual(19);
    expect(DEFINITIONS.length).toBeLessThanOrEqual(24);
  });
  it("every component has terminals, unique kind and unique param names", () => {
    expect(new Set(DEFINITIONS.map((d) => d.kind)).size).toBe(DEFINITIONS.length);
    for (const d of DEFINITIONS) {
      expect(d.terminals.length, d.kind).toBeGreaterThan(0);
      expect(d.systems.length, d.kind).toBeGreaterThan(0);
      expect(new Set(d.params.map((p) => p.name)).size, d.kind).toBe(d.params.length);
      for (const p of d.params)
        expect(
          p.required || p.default !== undefined || p.name === "system" || p.name === "voltage",
          `${d.kind}.${p.name}`,
        ).toBe(true);
    }
  });
  it("validates parameters and states", () => {
    expect(paramValid("load", "power", { v: 1000, u: "W" })).toBe(true);
    expect(paramValid("load", "power", "x")).toBe(false);
    expect(paramValid("load", "system", "ac3")).toBe(true);
    expect(paramValid("load", "system", "ac9")).toBe(false);
    expect(paramValid("load", "nope", 1)).toBe(false);
    expect(paramValid("zzz", "power", 1)).toBe(false);
    expect(stateValid("breaker", "open")).toBe(true);
    expect(stateValid("breaker", "grounded")).toBe(false);
    expect(stateValid("load", "open")).toBe(false);
    expect(terminalsFor("breaker")?.map((t) => t.role)).toEqual(["in", "out"]);
    expect(terminalsFor("zzz")).toBeUndefined();
  });
});

describe("standards tables", () => {
  it("each table has a source, edition and date", () => {
    for (const t of [ampacity, conductors, profiles]) {
      expect(t.source).not.toBe("");
      expect(t.edition).not.toBe("");
      expect(t.dateTaken).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("ampacity rows have one value per section, grow with section, and 3-loaded is below 2-loaded", () => {
    for (const r of ampacity.rows) {
      expect(r.amps.length).toBe(SECTIONS_MM2.length);
      for (let i = 1; i < r.amps.length; i++) expect(r.amps[i]!).toBeGreaterThan(r.amps[i - 1]!);
    }
    expect(lookupAmpacity("C", "Cu", "PVC", 3, 10)!).toBeLessThan(lookupAmpacity("C", "Cu", "PVC", 2, 10)!);
    expect(lookupAmpacity("C", "Cu", "XLPE", 3, 10)!).toBeGreaterThan(lookupAmpacity("C", "Cu", "PVC", 3, 10)!);
    expect(lookupAmpacity("C", "Al", "PVC", 3, 10)).toBeUndefined();
    expect(lookupAmpacity("C", "Cu", "PVC", 3, 11)).toBeUndefined();
  });
  it("conductor data is within physical ranges", () => {
    const d = conductors.rows;
    expect(d.resistivity20.Cu).toBeGreaterThan(0.015);
    expect(d.resistivity20.Cu).toBeLessThan(0.02);
    expect(d.resistivity20.Al).toBeGreaterThan(d.resistivity20.Cu);
    expect(d.k.Cu.XLPE!).toBeGreaterThan(d.k.Cu.PVC!);
  });
  it("profiles hold the c factors", () => {
    expect(profiles.rows.il.cFactors.lvMax).toBe(1.05);
    expect(profiles.rows.iec.cFactors.lvMax).toBe(1.1);
    expect(profiles.rows.il.cFactors.mvMax).toBe(1.1);
  });
});
