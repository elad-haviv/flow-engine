import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { solve } from "../src";
import { build, type BuildSpec } from "./support";

const load = (id: string): { build: BuildSpec } =>
  JSON.parse(readFileSync(join(__dirname, "reference", `${id}.json`), "utf8")) as { build: BuildSpec };
const isTraced = (x: unknown): boolean =>
  typeof x === "object" && x !== null && "trace" in x && "value" in x && "unit" in x;

/** Collect paths of numbers that are not wrapped in a traced quantity. */
function bareNumbers(x: unknown, path = "$", out: string[] = []): string[] {
  if (typeof x === "number") out.push(path);
  else if (isTraced(x)) return out;
  else if (Array.isArray(x)) x.forEach((v, i) => bareNumbers(v, `${path}[${i}]`, out));
  else if (typeof x === "object" && x !== null)
    for (const [k, v] of Object.entries(x)) bareNumbers(v, `${path}.${k}`, out);
  return out;
}
function traces(x: unknown, out: Array<{ assumed: boolean; formula: string; inputs: unknown[] }> = []) {
  if (isTraced(x)) out.push((x as { trace: (typeof out)[number] }).trace);
  else if (Array.isArray(x)) x.forEach((v) => traces(v, out));
  else if (typeof x === "object" && x !== null) Object.values(x).forEach((v) => traces(v, out));
  return out;
}

describe("traces", () => {
  for (const id of ["SC-001", "LF-002", "CS-001", "LP-001", "CV-001", "LF-004"]) {
    it(`${id}: every result number is traced and every trace is complete`, () => {
      const r = solve(build(load(id).build).project, { profile: "il" });
      expect(bareNumbers({ ...r, diagnostics: undefined })).toEqual([]);
      const all = traces(r);
      expect(all.length).toBeGreaterThan(0);
      for (const t of all) {
        expect(t.formula).not.toBe("");
        expect(Array.isArray(t.inputs)).toBe(true);
      }
    });
    it(`${id}: an assumed value always comes with a diagnostic`, () => {
      const r = solve(build(load(id).build).project, { profile: "il" });
      if (traces(r).some((t) => t.assumed))
        expect(
          r.diagnostics.some((d) =>
            ["engine.param.defaulted", "engine.assumption.used", "engine.standards.unverified"].includes(d.code),
          ),
        ).toBe(true);
    });
  }
});
