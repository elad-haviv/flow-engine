import { describe, expect, it } from "vitest";
import { applyCommand, checkConsistency, CODES, loadDocument, saveDocument, type Command, type Project } from "../src";
import { base, cmd, ctx, cu, fc } from "./helpers";

function built(): { p: Project; journal: Command[] } {
  let p = base();
  const journal: Command[] = [
    cmd("project.create", { name: "P", locale: "he", profile: { id: "il", edition: "2026" } }),
  ];
  for (const c of [
    cmd("device.add", { kind: "grid", name: "G", params: { u: { v: 400, u: "V" } } }),
    cmd("device.add", { kind: "load", name: "L", params: {} }),
  ]) {
    const r = applyCommand(p, c, ctx);
    if (!r.ok) throw new Error();
    p = r.project;
    journal.push(r.command);
  }
  const w = cmd("wire.add", {
    cable: { lengthM: 3, installation: "A", conductors: [cu] },
    from: { terminalId: p.terminals[0]!.id },
    to: { terminalId: p.terminals[1]!.id },
  });
  const r = applyCommand(p, w, ctx);
  if (!r.ok) throw new Error();
  return { p: r.project, journal: [...journal, r.command] };
}

describe("document", () => {
  it("round-trips random projects (200 runs)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { maxLength: 6 }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (names, num) => {
          let p = base();
          for (const n of names) {
            const r = applyCommand(p, cmd("device.add", { kind: "load", name: n, params: { x: num } }), ctx);
            if (r.ok) p = r.project;
          }
          const res = loadDocument(saveDocument({ project: p, journal: [], extra: [] }));
          expect(res.ok && JSON.parse(JSON.stringify(res.doc.project))).toEqual(JSON.parse(JSON.stringify(p)));
        },
      ),
      { numRuns: 200 },
    );
  });
  it("keeps unknown fields and warns", () => {
    const { p, journal } = built();
    const doc = JSON.parse(saveDocument({ project: p, journal, extra: [] }));
    doc.newTop = { a: 1 };
    doc.project.devices[0].futureField = "keep";
    const r = loadDocument(JSON.stringify(doc));
    if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
    expect(r.diagnostics.map((d) => d.code)).toEqual([CODES.fileUnknownField, CODES.fileUnknownField]);
    expect(r.doc.extra.map((e) => e.path.join("/")).sort()).toEqual(
      [`newTop`, `project/devices/#${p.devices[0]!.id}/futureField`].sort(),
    );
    const again = loadDocument(saveDocument(r.doc));
    expect(again.ok && again.doc.extra).toEqual(r.doc.extra);
  });
  it("refuses a future version and bad input with diagnostics", () => {
    const { p } = built();
    const doc = JSON.parse(saveDocument({ project: p, journal: [], extra: [] }));
    doc.schemaVersion = 99;
    const r = loadDocument(JSON.stringify(doc));
    expect(!r.ok && r.diagnostics[0]!.code).toBe(CODES.fileUnsupportedVersion);
    expect(loadDocument("nope").ok).toBe(false);
    expect(loadDocument("{}").ok).toBe(false);
    doc.schemaVersion = 1;
    delete doc.project.name;
    expect(loadDocument(JSON.stringify(doc)).ok).toBe(false);
    expect(loadDocument(JSON.stringify({ format: "flow-project" })).ok).toBe(false);
  });
  it("opens the version 1 fixture", async () => {
    const { p, journal } = built();
    const fixture = await import("./fixtures/v1.json");
    const r = loadDocument(JSON.stringify(fixture.default));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.doc.project.devices).toHaveLength(2);
      expect(r.doc.project.name).toBe(p.name);
      expect(journal.length).toBeGreaterThan(0);
    }
  });
  it("consistency: matching journal is clean, corrupted one warns and the document wins", () => {
    const { p, journal } = built();
    expect(checkConsistency({ project: p, journal, extra: [] }, ctx)).toEqual([]);
    const bad = journal.map((c) =>
      c.type === "device.add" && (c.payload as { name: string }).name === "L"
        ? { ...c, payload: { ...(c.payload as object), name: "other" } }
        : c,
    ) as Command[];
    const d = checkConsistency({ project: p, journal: bad, extra: [] }, ctx);
    expect(d.map((x) => x.code)).toEqual([CODES.fileJournalMismatch]);
    expect(p.devices[1]!.name).toBe("L");
    expect(checkConsistency({ project: p, journal: journal.slice(1), extra: [] }, ctx)).toEqual([]);
    const broken = [journal[0]!, cmd("device.remove", { deviceId: "x".repeat(26) })];
    expect(checkConsistency({ project: p, journal: broken, extra: [] }, ctx)).toHaveLength(1);
  });
});
