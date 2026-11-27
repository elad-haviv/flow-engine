import { describe, expect, it } from "vitest";
import { catalogs, placeholders } from "../src";

describe("catalogs", () => {
  it("have the same keys and parameters", () => {
    expect(Object.keys(catalogs.he).sort()).toEqual(Object.keys(catalogs.en).sort());
    for (const k of Object.keys(catalogs.en))
      expect(placeholders(catalogs.he[k]!), k).toEqual(placeholders(catalogs.en[k]!));
  });
  it("have no empty messages", () => {
    for (const l of ["he", "en"] as const)
      for (const [k, v] of Object.entries(catalogs[l])) expect(v.trim(), `${l}:${k}`).not.toBe("");
  });
});
