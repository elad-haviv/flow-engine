import { describe, expect, it } from "vitest";
import {
  append,
  applyCommand,
  createProject,
  newId,
  saveDocument,
  type ApplyContext,
  type Command,
  type Journal,
} from "../../packages/model/src";

const ctx: ApplyContext = {
  newId: () => newId(),
  now: () => "2026-11-27T00:00:00Z",
  terminalsFor: () => [
    { role: "in", conductors: [] },
    { role: "out", conductors: [] },
  ],
  paramValid: () => true,
  stateValid: () => true,
};

describe("journal size", () => {
  it("a 1,000-device project with a full journal stays under 5 MB", () => {
    let p = createProject("big", "he", { id: "il", edition: "2026" });
    let journal: Journal = [];
    for (let i = 0; i < 1000; i++) {
      const c: Command = {
        id: newId(),
        type: "device.add",
        v: 1,
        at: ctx.now(),
        by: "local",
        payload: { kind: "load", name: `d${i}`, params: { p: { v: 1000, u: "W" } } },
      };
      const r = applyCommand(p, c, ctx);
      if (!r.ok) throw new Error(r.diagnostic.code);
      p = r.project;
      journal = append(journal, r.command);
    }
    for (let i = 0; i < 4000; i++)
      journal = append(journal, {
        id: newId(),
        type: "project.rename",
        v: 1,
        at: ctx.now(),
        by: "local",
        payload: { name: `n${i}` },
      });
    const bytes = saveDocument({ project: p, journal, extra: [] }).length;
    console.log("document bytes", bytes);
    expect(journal).toHaveLength(5000);
    expect(bytes).toBeLessThan(5_000_000);
  });
});
