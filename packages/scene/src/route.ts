import type { Point, Side } from "./types";

const STUB = 20;
const out = (p: Point, s: Side): Point =>
  s === "top"
    ? { x: p.x, y: p.y - STUB }
    : s === "bottom"
      ? { x: p.x, y: p.y + STUB }
      : s === "left"
        ? { x: p.x - STUB, y: p.y }
        : { x: p.x + STUB, y: p.y };
const vertical = (s: Side): boolean => s === "top" || s === "bottom";

/** Orthogonal route between two terminals. Each end leaves its terminal straight, then the two stubs are joined. */
export function routeWire(a: Point, aSide: Side, b: Point, bSide: Side): Point[] {
  const a1 = out(a, aSide);
  const b1 = out(b, bSide);
  let mid: Point[];
  if (vertical(aSide) && vertical(bSide)) {
    const y = (a1.y + b1.y) / 2;
    mid = [
      { x: a1.x, y },
      { x: b1.x, y },
    ];
  } else if (!vertical(aSide) && !vertical(bSide)) {
    const x = (a1.x + b1.x) / 2;
    mid = [
      { x, y: a1.y },
      { x, y: b1.y },
    ];
  } else if (vertical(aSide)) mid = [{ x: a1.x, y: b1.y }];
  else mid = [{ x: b1.x, y: a1.y }];
  return dedupe([a, a1, ...mid, b1, b]);
}

function dedupe(pts: Point[]): Point[] {
  const res: Point[] = [];
  for (const p of pts) {
    const last = res[res.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) res.push(p);
  }
  return res;
}
