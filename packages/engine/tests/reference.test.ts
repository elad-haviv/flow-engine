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

function pick(r: Results, b: Built, e: Expect): number | boolean | string {
  const node = (ref: string) => r.nodes.find((x) => x.terminals.includes(b.terminal(ref)))!.key;
  const dev = (name: string) => b.deviceIds.get(name)!;
  const cable = () => r.cableChecks[0]!;
  switch (e.select) {
    case "loadVoltage":
      return r.loads.find((x) => x.deviceId === dev(e.device!))!.voltage.value;
    case "loadDrop":
      return r.loads.find((x) => x.deviceId === dev(e.device!))!.dropPercent.value;
    case "sourceP":
      return r.sources.find((x) => x.deviceId === dev(e.device!))!.activePower.value;
    case "ik3Max":
      return r.faults.find((x) => x.nodeKey === node(e.at!))!.ik3Max.value;
    case "ik3Min":
      return r.faults.find((x) => x.nodeKey === node(e.at!))!.ik3Min.value;
    case "ik2Min":
      return r.faults.find((x) => x.nodeKey === node(e.at!))!.ik2Min.value;
    case "ip":
      return r.faults.find((x) => x.nodeKey === node(e.at!))!.ipMax.value;
    case "loopVoltage":
      return r.loops.find((x) => x.regulatorId === dev(e.device!))!.voltage.value;
    case "loopPower":
      return r.loops.find((x) => x.regulatorId === dev(e.device!))!.power.value;
    case "method":
      return r.islands[0]!.method;
    case "loadCount":
      return r.loads.length;
    case "cable":
      return (cable()[e.field as "ib"] as { value: number }).value;
    case "cablePass":
      return cable().passes![e.field as "current"];
    case "diag":
      return r.diagnostics.some((d) => d.code === e.code);
    default:
      throw new Error(`unknown selector ${e.select}`);
  }
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
