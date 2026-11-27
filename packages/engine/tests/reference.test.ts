import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { solve, type Results } from "../src";
import { build, type BuildSpec, type Built } from "./support";

interface Expect {
  select: string;
  at?: string;
  device?: string;
  field?: string;
  code?: string;
  value: number | boolean | string;
  tolerance?: number;
}
interface Case {
  id: string;
  title: string;
  profile: "il" | "iec";
  source: string;
  signedOffBy: string | null;
  signedOffOn: string | null;
  build: BuildSpec;
  expected: Expect[];
}

const dir = join(__dirname, "reference");
const cases: Case[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as Case);

type Picker = (r: Results, b: Built, e: Expect) => number | boolean | string;
const node = (r: Results, b: Built, ref: string) => r.nodes.find((x) => x.terminals.includes(b.terminal(ref)))!.key;
const dev = (b: Built, name: string) => b.deviceIds.get(name)!;
const fault = (r: Results, b: Built, e: Expect) => r.faults.find((x) => x.nodeKey === node(r, b, e.at!))!;
const loadOf = (r: Results, b: Built, e: Expect) => r.loads.find((x) => x.deviceId === dev(b, e.device!))!;
const loopOf = (r: Results, b: Built, e: Expect) => r.loops.find((x) => x.regulatorId === dev(b, e.device!))!;

const PICKERS: Record<string, Picker> = {
  loadVoltage: (r, b, e) => loadOf(r, b, e).voltage.value,
  loadDrop: (r, b, e) => loadOf(r, b, e).dropPercent.value,
  sourceP: (r, b, e) => r.sources.find((x) => x.deviceId === dev(b, e.device!))!.activePower.value,
  ik3Max: (r, b, e) => fault(r, b, e).ik3Max.value,
  ik3Min: (r, b, e) => fault(r, b, e).ik3Min.value,
  ik2Min: (r, b, e) => fault(r, b, e).ik2Min.value,
  ip: (r, b, e) => fault(r, b, e).ipMax.value,
  loopVoltage: (r, b, e) => loopOf(r, b, e).voltage.value,
  loopPower: (r, b, e) => loopOf(r, b, e).power.value,
  method: (r) => r.islands[0]!.method,
  loadCount: (r) => r.loads.length,
  cable: (r, _b, e) => (r.cableChecks[0]![e.field as "ib"] as { value: number }).value,
  cablePass: (r, _b, e) => r.cableChecks[0]!.passes![e.field as "current"],
  diag: (r, _b, e) => r.diagnostics.some((d) => d.code === e.code),
};

function pick(r: Results, b: Built, e: Expect): number | boolean | string {
  const f = PICKERS[e.select];
  if (!f) throw new Error(`unknown selector ${e.select}`);
  return f(r, b, e);
}

describe("reference cases", () => {
  it("covers the minimum set from the spec", () => {
    const ids = cases.map((c) => c.id.split("-")[0]);
    for (const k of ["LF", "SC", "CS", "LP", "CV", "SW", "FL"]) expect(ids, k).toContain(k);
    expect(cases.length).toBeGreaterThanOrEqual(15);
  });
  for (const c of cases) {
    it(`${c.id}: ${c.title}`, () => {
      const b = build(c.build);
      const r = solve(b.project, { profile: c.profile });
      for (const e of c.expected) {
        const got = pick(r, b, e);
        if (typeof e.value === "number")
          expect(
            (Math.abs((got as number) - e.value) / Math.max(Math.abs(e.value), 1e-12)) * (e.value === 0 ? 0 : 1) +
              (e.value === 0 ? Math.abs(got as number) : 0),
            `${c.id} ${e.select} got ${String(got)} want ${e.value}`,
          ).toBeLessThanOrEqual(e.tolerance ?? 1e-6);
        else expect(got, `${c.id} ${e.select}`).toBe(e.value);
      }
    });
  }
});
