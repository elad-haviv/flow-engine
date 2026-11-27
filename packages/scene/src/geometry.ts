import type { Point, Prim, Rect, Scene, SceneElement } from "./types";

export const rectContains = (r: Rect, p: Point): boolean =>
  p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
export const rectsOverlap = (a: Rect, b: Rect): boolean =>
  a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;

export function union(rects: Rect[]): Rect {
  if (!rects.length) return { x: 0, y: 0, w: 0, h: 0 };
  const x1 = Math.min(...rects.map((r) => r.x));
  const y1 = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.w));
  const y2 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export function pointsBounds(pts: Point[], pad = 0): Rect {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
}

export function primBounds(p: Prim): Rect {
  switch (p.t) {
    case "line":
      return pointsBounds([
        { x: p.x1, y: p.y1 },
        { x: p.x2, y: p.y2 },
      ]);
    case "rect":
      return { x: p.x, y: p.y, w: p.w, h: p.h };
    case "circle":
      return { x: p.cx - p.r, y: p.cy - p.r, w: 2 * p.r, h: 2 * p.r };
    case "polyline":
      return pointsBounds(p.points);
    case "text":
      return { x: p.x - 20, y: p.y - 10, w: 40, h: 12 };
    case "path":
      return { x: 0, y: 0, w: 0, h: 0 };
  }
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function distanceToPath(p: Point, path: Point[]): number {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) best = Math.min(best, distanceToSegment(p, path[i - 1]!, path[i]!));
  return best;
}

/** Topmost element under a point: wires within `tolerance`, other elements by their bounds. Later elements win. */
export function hitTest(elements: SceneElement[], p: Point, tolerance = 6): SceneElement | undefined {
  for (let i = elements.length - 1; i >= 0; i--) {
    const e = elements[i]!;
    if (e.path ? distanceToPath(p, e.path) <= tolerance : rectContains(e.bounds, p)) return e;
  }
  return undefined;
}

export const sceneBounds = (s: SceneElement[]): Scene["bounds"] => union(s.map((e) => e.bounds));

/** Move a primitive. Paths are moved by wrapping them in a translated group by the renderer, so they are returned unchanged here. */
export function translate(p: Prim, dx: number, dy: number): Prim {
  switch (p.t) {
    case "line":
      return { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy };
    case "rect":
      return { ...p, x: p.x + dx, y: p.y + dy };
    case "circle":
      return { ...p, cx: p.cx + dx, cy: p.cy + dy };
    case "polyline":
      return { ...p, points: p.points.map((q) => ({ x: q.x + dx, y: q.y + dy })) };
    case "text":
      return { ...p, x: p.x + dx, y: p.y + dy };
    case "path":
      return { ...p, d: shiftPath(p.d, dx, dy) };
  }
}

/** Shift the absolute coordinates of a path made of M/L/Q/T commands. Relative commands (lowercase) are left alone. */
function shiftPath(d: string, dx: number, dy: number): string {
  const tokens = d.split(/\s+/);
  let abs = false;
  let flip = false;
  return tokens
    .map((t) => {
      if (/^[A-Za-z]$/.test(t)) {
        abs = t === t.toUpperCase();
        flip = false;
        return t;
      }
      if (!abs) return t;
      flip = !flip;
      return String(Number(t) + (flip ? dx : dy));
    })
    .join(" ");
}
