import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { solve } from "../src";
import { build, type BuildSpec } from "./support";

it("gives identical results across 100 runs", () => {
  const c = JSON.parse(readFileSync(join(__dirname, "reference", "LF-002.json"), "utf8")) as { build: BuildSpec };
  const p = build(c.build).project;
  const first = JSON.stringify(solve(p, { profile: "il" }));
  for (let i = 0; i < 100; i++) expect(JSON.stringify(solve(p, { profile: "il" }))).toBe(first);
});
