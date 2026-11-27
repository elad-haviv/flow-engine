import { describe, expect, it } from "vitest";
import { direction, format, formatNumber, formatQuantity, isolate } from "../src";

describe("format", () => {
  const c = { hi: "Hello {name}", n_one: "{count} item", n_two: "two items", n_other: "{count} items" };
  it("fills placeholders", () => expect(format(c, "en", "hi", { name: "A" })).toBe("Hello A"));
  it("plural English", () => {
    expect(format(c, "en", "n", { count: 1 })).toBe("1 item");
    expect(format(c, "en", "n", { count: 5 })).toBe("5 items");
  });
  it("plural Hebrew uses the two category", () => expect(format(c, "he", "n", { count: 2 })).toBe("two items"));
  it("missing key or param throws", () => {
    expect(() => format(c, "en", "zz")).toThrow();
    expect(() => format(c, "en", "hi")).toThrow();
  });
  it("direction, isolate and numbers", () => {
    expect(direction("he")).toBe("rtl");
    expect(direction("en")).toBe("ltr");
    expect(isolate("x")).toContain("x");
    expect(formatNumber("en", 1234.5)).toContain("1,234.5");
    expect(formatQuantity("en", 400, "V")).toContain("400 V");
  });
});
