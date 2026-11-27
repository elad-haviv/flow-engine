import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Scene } from "@flow/scene";
import { boqCsv, dxfText, parseCsv, parsePriceList, scheduleCsv, toCsv, toDxf } from "../src";

describe("csv", () => {
  it("quotes, round-trips and starts with a byte-order mark", () => {
    const rows = [
      ["a", "b,c", 'say "hi"', "line\nbreak"],
      ["שלום", "1.5", "", "x;y"],
    ];
    const text = toCsv(rows);
    expect(text.startsWith("﻿")).toBe(true);
    expect(text.endsWith("\r\n")).toBe(true);
    expect(parseCsv(text)).toEqual(rows);
  });
  it("detects a semicolon separator and skips blank lines", () => {
    expect(parseCsv("a;b\r\n\r\n1,5;2\r\n")).toEqual([
      ["a", "b"],
      ["1,5", "2"],
    ]);
  });
  it("handles a final row without a line ending and lone carriage returns", () => {
    expect(parseCsv("a,b\r1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("price list import", () => {
  it("reads a list in any column order, with a comma decimal, and reports bad rows without guessing", () => {
    const text =
      "price;key;description;unit;currency\n12,5;breaker|ratedCurrent=50;MCB 50A;pc;ILS\nabc;x;bad;pc;ILS\n3;;nokey;pc;ILS\n4;breaker|ratedCurrent=50;dup;pc;ILS\n7;y;ok;m;ILS\n";
    const { list, errors } = parsePriceList("Supplier", text);
    expect(list.items.map((i) => [i.key, i.price])).toEqual([
      ["breaker|ratedCurrent=50", 12.5],
      ["y", 7],
    ]);
    expect(errors).toEqual([
      { line: 3, code: "bad_price" },
      { line: 4, code: "empty_key" },
      { line: 5, code: "duplicate_key" },
    ]);
  });
  it("refuses a file without the required columns", () => {
    const r = parsePriceList("x", "key,price\na,1\n");
    expect(r.list.items).toEqual([]);
    expect(r.errors).toEqual([{ line: 1, code: "missing_column" }]);
    expect(parsePriceList("x", "").errors).toHaveLength(1);
  });
});

const scene: Scene = {
  bounds: { x: 0, y: 0, w: 100, h: 100 },
  elements: [
    {
      id: "d",
      entityId: "d",
      layer: "device",
      bounds: { x: 0, y: 0, w: 60, h: 60 },
      prims: [
        { t: "circle", cx: 30, cy: 30, r: 18 },
        { t: "rect", x: 10, y: 10, w: 40, h: 40 },
        { t: "text", x: 30, y: 80, text: "⁨משאבה P1⁩", anchor: "middle" },
        { t: "ellipse", cx: 30, cy: 30, rx: 10, ry: 5 },
      ],
    },
    {
      id: "w",
      entityId: "w",
      layer: "wire",
      bounds: { x: 0, y: 0, w: 10, h: 10 },
      prims: [
        {
          t: "polyline",
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 20 },
            { x: 40, y: 20 },
          ],
        },
        { t: "line", x1: 1, y1: 2, x2: 3, y2: 4 },
        { t: "path", d: "M 0 0" },
      ],
    },
    {
      id: "z",
      entityId: "z",
      layer: "zone",
      bounds: { x: 0, y: 0, w: 10, h: 10 },
      prims: [{ t: "text", x: 6, y: 16, text: "Z1", anchor: "start" }],
    },
    { id: "n", entityId: "n", layer: "annotation", bounds: { x: 0, y: 0, w: 10, h: 10 }, prims: [] },
  ],
};

describe("dxf", () => {
  it("escapes non-ASCII text and drops direction marks", () => {
    expect(dxfText("⁨אב P1⁩")).toBe("\\U+05D0\\U+05D1 P1");
    expect(dxfText("plain")).toBe("plain");
  });
  it("is a well-formed group-code file with layers, entities and the y axis flipped", () => {
    const dxf = toDxf(scene);
    const lines = dxf.split("\n");
    expect(lines.length % 2).toBe(1);
    expect(dxf.endsWith("0\nEOF\n")).toBe(true);
    for (let i = 0; i < lines.length - 1; i += 2) expect(lines[i]).toMatch(/^\s*\d+$/);
    const entities = dxf.split("ENTITIES")[1]!;
    expect(entities.match(/^LINE$/gm)!.length).toBe(4 + 36 + 2 + 1);
    expect(entities).toContain("CIRCLE");
    expect(entities.match(/^TEXT$/gm)).toHaveLength(2);
    expect(entities).toContain("\\U+05DE");
    expect(dxf).toContain("WIRES");
    expect(dxf).toContain("ZONES");
    expect(dxf).toContain("NOTES");
    expect(entities).toContain("20\n-30\n");
  });
  it("matches the golden file", () => {
    expect(toDxf(scene)).toBe(readFileSync(join(__dirname, "golden", "sample.dxf"), "utf8"));
  });
});

describe("document csv", () => {
  const t = (k: string) => k;
  it("schedule and bill of quantities columns and footer", () => {
    const s = scheduleCsv(
      [
        {
          deviceId: "1",
          name: "L1",
          kind: "load",
          protective: { id: "q", name: "Q1", ratedA: 50 },
          cable: { material: "Cu", insulation: "PVC", sectionMm2: 10, lengthM: 30, conductors: 1 },
          powerW: 15000.4,
          currentA: 24.56,
          cableOk: true,
        },
        { deviceId: "2", name: "L2", kind: "load" },
      ],
      t,
    );
    expect(s).toContain("doc.col.name,doc.col.kind");
    expect(s).toContain("L1,kind.load,Q1,50,Cu PVC 10,30,15000,24.6,,,,doc.ok");
    expect(s).toContain("L2,kind.load,,,,,,,,,,");
    const b = boqCsv(
      [
        {
          line: { key: "k", class: "device", what: "breaker", attrs: {}, unit: "pc", quantity: 2 },
          unitPrice: 10,
          total: 20,
          source: { type: "list", list: "A" },
        },
        { line: { key: "m", class: "cable", what: "cable", attrs: {}, unit: "m", quantity: 5 } },
      ],
      { pricedTotal: 20, unpricedLines: 1, discountPercent: 10, afterDiscount: 18, currencies: ["ILS"] },
      (l) => l.what,
      t,
    );
    expect(b).toContain("k,breaker,pc,2,10,A,20");
    expect(b).toContain("m,cable,m,5,,doc.unpriced,");
    expect(b).toContain("doc.discount,,,,,10%,18");
  });
});

describe("switching csv", () => {
  it("lists isolate steps, restore steps and problems", async () => {
    const { switchingCsv } = await import("../src");
    const t = (k: string) => k;
    const csv = switchingCsv(
      {
        isolate: [
          { n: 1, action: "open", deviceId: "q" },
          { n: 2, action: "verify_dead" },
        ],
        restore: [{ n: 1, action: "close", deviceId: "q" }],
        violations: [{ code: "still_live", deviceIds: ["q"] }],
      },
      (id) => `name-${id}`,
      t,
    );
    expect(csv).toContain("sw.isolate,1,sw.action.open,name-q");
    expect(csv).toContain("sw.isolate,2,sw.action.verify_dead,");
    expect(csv).toContain("sw.restore,1,sw.action.close,name-q");
    expect(csv).toContain("sw.violations,,sw.violation.still_live,name-q");
  });
});
