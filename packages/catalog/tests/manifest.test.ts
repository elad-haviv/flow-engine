import { describe, expect, it } from "vitest";
import { manifest } from "../src";

describe("standards manifest", () => {
  it("every entry has an edition and a date", () => {
    for (const e of manifest) {
      expect(e.edition).not.toBe("");
      expect(e.dateTaken).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(manifest.some((e) => e.profile === "il")).toBe(true);
  });
});
