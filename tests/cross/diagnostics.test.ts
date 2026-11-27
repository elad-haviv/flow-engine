import { describe, expect, it } from "vitest";
import { catalogs } from "../../packages/i18n/src";
import { CODES } from "../../packages/model/src";

describe("diagnostic codes", () => {
  it("each code has a Hebrew and an English message", () => {
    for (const code of Object.values(CODES))
      for (const l of ["he", "en"] as const) expect(catalogs[l][`diag.${code}`], `${l}:${code}`).toBeDefined();
  });
});
