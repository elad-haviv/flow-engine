import { describe, expect, it } from "vitest";
import { bestUnit, fmt, messageOf, parseNumber, toBase } from "../src";

describe("quantity helpers", () => {
  it("picks the largest unit that keeps the number at least 1", () => {
    expect(bestUnit(400, "V")).toEqual({ value: 400, unit: "V" });
    expect(bestUnit(20000, "V")).toEqual({ value: 20, unit: "kV" });
    expect(bestUnit(5e6, "VA")).toEqual({ value: 5, unit: "MVA" });
    expect(bestUnit(0.01, "s")).toEqual({ value: 10, unit: "ms" });
    expect(bestUnit(2, "s")).toEqual({ value: 2, unit: "s" });
    expect(bestUnit(0, "W")).toEqual({ value: 0, unit: "W" });
    expect(bestUnit(7, "ratio")).toEqual({ value: 7, unit: "ratio" });
  });
  it("converts back to the base unit and round-trips", () => {
    for (const [si, fam] of [
      [20000, "V"],
      [5e6, "VA"],
      [0.01, "s"],
      [63, "A"],
    ] as const) {
      const d = bestUnit(si, fam);
      expect(toBase(d.value, d.unit, fam)).toBeCloseTo(si, 9);
    }
    expect(toBase(3, "unknown", "none")).toBe(3);
  });
  it("parses typed numbers", () => {
    expect(parseNumber(" 12,5 ")).toBe(12.5);
    expect(parseNumber("")).toBeUndefined();
    expect(parseNumber("abc")).toBeUndefined();
    expect(fmt(1.23456789)).toBe("1.234568");
  });
});

describe("messageOf", () => {
  it("translates and falls back to the code when a parameter is missing", () => {
    expect(
      messageOf("en", { code: "model.project.name_empty", severity: "error", entities: [], params: {} }),
    ).toContain("name");
    expect(
      messageOf("en", { code: "engine.voltage.drop_exceeded", severity: "warning", entities: [], params: {} }),
    ).toBe("engine.voltage.drop_exceeded");
  });
  it("shows parameter names in the user's language for defaulted values", () => {
    const m = messageOf("he", {
      code: "engine.param.defaulted",
      severity: "info",
      entities: [],
      params: { params: "efficiency, powerFactor" },
    });
    expect(m).toContain("נצילות");
    expect(m).toContain("מקדם הספק");
    expect(
      messageOf("en", { code: "engine.param.defaulted", severity: "info", entities: [], params: { params: "zzz" } }),
    ).toContain("zzz");
  });
});
