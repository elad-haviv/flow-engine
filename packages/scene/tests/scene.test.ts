import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  SpatialGrid,
  distanceToPath,
  hitTest,
  pointsBounds,
  primBounds,
  rectContains,
  rectsOverlap,
  routeWire,
  sceneBounds,
  union,
  type Side,
  type SceneElement,
} from "../src";

describe("geometry", () => {
  it("bounds and overlap", () => {
    expect(
      union([
        { x: 0, y: 0, w: 10, h: 10 },
        { x: 20, y: 5, w: 10, h: 10 },
      ]),
    ).toEqual({ x: 0, y: 0, w: 30, h: 15 });
    expect(union([])).toEqual({ x: 0, y: 0, w: 0, h: 0 });
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 11, y: 0, w: 5, h: 5 })).toBe(false);
    expect(rectContains({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5 })).toBe(true);
    expect(
      pointsBounds(
        [
          { x: 1, y: 2 },
          { x: 4, y: 8 },
        ],
        1,
      ),
    ).toEqual({ x: 0, y: 1, w: 5, h: 8 });
    expect(primBounds({ t: "circle", cx: 5, cy: 5, r: 2 })).toEqual({ x: 3, y: 3, w: 4, h: 4 });
    expect(primBounds({ t: "line", x1: 0, y1: 0, x2: 4, y2: 3 })).toEqual({ x: 0, y: 0, w: 4, h: 3 });
    expect(primBounds({ t: "rect", x: 1, y: 1, w: 2, h: 2 }).w).toBe(2);
    expect(primBounds({ t: "ellipse", cx: 5, cy: 5, rx: 4, ry: 2 })).toEqual({ x: 1, y: 3, w: 8, h: 4 });
    expect(
      primBounds({
        t: "polyline",
        points: [
          { x: 0, y: 0 },
          { x: 2, y: 2 },
        ],
      }).w,
    ).toBe(2);
    expect(primBounds({ t: "text", x: 0, y: 0, text: "a" }).w).toBeGreaterThan(0);
    expect(primBounds({ t: "path", d: "M0 0" }).w).toBe(0);
  });
  it("distance to a path", () => {
    expect(
      distanceToPath({ x: 5, y: 3 }, [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]),
    ).toBe(3);
    expect(
      distanceToPath({ x: 20, y: 0 }, [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]),
    ).toBe(10);
    expect(
      distanceToPath({ x: 1, y: 1 }, [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ]),
    ).toBeCloseTo(Math.SQRT2);
  });
  it("hit testing prefers the topmost and uses tolerance for wires", () => {
    const els: SceneElement[] = [
      { id: "a", entityId: "a", layer: "device", prims: [], bounds: { x: 0, y: 0, w: 60, h: 60 } },
      {
        id: "w",
        entityId: "w",
        layer: "wire",
        prims: [],
        bounds: { x: 0, y: 0, w: 100, h: 0 },
        path: [
          { x: 0, y: 30 },
          { x: 100, y: 30 },
        ],
      },
    ];
    expect(hitTest(els, { x: 30, y: 33 })?.id).toBe("w");
    expect(hitTest(els, { x: 30, y: 50 })?.id).toBe("a");
    expect(hitTest(els, { x: 300, y: 300 })).toBeUndefined();
    expect(sceneBounds(els).w).toBe(100);
  });
});

describe("spatial grid", () => {
  it("returns exactly the overlapping boxes (random)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            x: fc.integer({ min: -1000, max: 1000 }),
            y: fc.integer({ min: -1000, max: 1000 }),
            w: fc.integer({ min: 1, max: 300 }),
            h: fc.integer({ min: 1, max: 300 }),
          }),
          { maxLength: 40 },
        ),
        fc.record({
          x: fc.integer({ min: -1000, max: 1000 }),
          y: fc.integer({ min: -1000, max: 1000 }),
          w: fc.integer({ min: 1, max: 600 }),
          h: fc.integer({ min: 1, max: 600 }),
        }),
        (boxes, q) => {
          const g = new SpatialGrid(200);
          boxes.forEach((b, i) => g.insert(String(i), b));
          const want = boxes
            .map((b, i) => (rectsOverlap(b, q) ? String(i) : ""))
            .filter(Boolean)
            .sort();
          expect(g.query(q).sort()).toEqual(want);
        },
      ),
    );
  });
  it("moves and removes", () => {
    const g = new SpatialGrid();
    g.insert("a", { x: 0, y: 0, w: 10, h: 10 });
    g.insert("a", { x: 1000, y: 1000, w: 10, h: 10 });
    expect(g.query({ x: 0, y: 0, w: 50, h: 50 })).toEqual([]);
    g.remove("a");
    g.remove("zzz");
    expect(g.query({ x: 900, y: 900, w: 300, h: 300 })).toEqual([]);
  });
});

describe("wire routing", () => {
  const sides: Side[] = ["top", "bottom", "left", "right"];
  it("every segment is horizontal or vertical, for every side pair", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -300, max: 300 }),
        fc.integer({ min: -300, max: 300 }),
        fc.constantFrom(...sides),
        fc.constantFrom(...sides),
        (bx, by, as, bs) => {
          const r = routeWire({ x: 0, y: 0 }, as, { x: bx, y: by }, bs);
          expect(r[0]).toEqual({ x: 0, y: 0 });
          expect(r[r.length - 1]).toEqual({ x: bx, y: by });
          for (let i = 1; i < r.length; i++) expect(r[i]!.x === r[i - 1]!.x || r[i]!.y === r[i - 1]!.y).toBe(true);
        },
      ),
    );
  });
  it("a bottom terminal above a top terminal gets a Z route", () => {
    expect(routeWire({ x: 30, y: 60 }, "bottom", { x: 90, y: 160 }, "top")).toEqual([
      { x: 30, y: 60 },
      { x: 30, y: 80 },
      { x: 30, y: 110 },
      { x: 90, y: 110 },
      { x: 90, y: 140 },
      { x: 90, y: 160 },
    ]);
  });
  it("horizontal and mixed sides", () => {
    expect(routeWire({ x: 0, y: 0 }, "right", { x: 100, y: 50 }, "left").length).toBeGreaterThan(3);
    expect(routeWire({ x: 0, y: 0 }, "bottom", { x: 100, y: 50 }, "left").length).toBeGreaterThan(2);
    expect(routeWire({ x: 0, y: 0 }, "right", { x: 100, y: 50 }, "top").length).toBeGreaterThan(2);
  });
});

describe("translate", () => {
  it("moves every primitive kind, including absolute path coordinates", async () => {
    const { translate } = await import("../src");
    expect(translate({ t: "line", x1: 0, y1: 0, x2: 1, y2: 1 }, 5, 6)).toEqual({
      t: "line",
      x1: 5,
      y1: 6,
      x2: 6,
      y2: 7,
    });
    expect(translate({ t: "ellipse", cx: 0, cy: 0, rx: 2, ry: 1 }, 3, 4)).toEqual({
      t: "ellipse",
      cx: 3,
      cy: 4,
      rx: 2,
      ry: 1,
    });
    expect(translate({ t: "rect", x: 0, y: 0, w: 2, h: 2 }, 1, 1)).toEqual({ t: "rect", x: 1, y: 1, w: 2, h: 2 });
    expect(translate({ t: "circle", cx: 0, cy: 0, r: 1 }, 1, 2)).toEqual({ t: "circle", cx: 1, cy: 2, r: 1 });
    expect(translate({ t: "text", x: 0, y: 0, text: "a" }, 3, 4)).toMatchObject({ x: 3, y: 4 });
    expect(translate({ t: "polyline", points: [{ x: 0, y: 0 }] }, 1, 1)).toEqual({
      t: "polyline",
      points: [{ x: 1, y: 1 }],
    });
    expect(translate({ t: "path", d: "M 20 24 q 5 -10 10 0 t 10 0" }, 100, 200)).toEqual({
      t: "path",
      d: "M 120 224 q 5 -10 10 0 t 10 0",
    });
  });
});
