import type { Prim } from "@flow/scene";

export const S = 60;
const m = S / 2;
export const line = (x1: number, y1: number, x2: number, y2: number): Prim => ({ t: "line", x1, y1, x2, y2 });
export const circle = (cx: number, cy: number, r: number): Prim => ({ t: "circle", cx, cy, r });
export const rect = (x: number, y: number, w: number, h: number): Prim => ({ t: "rect", x, y, w, h });
export const text = (x: number, y: number, s: string): Prim => ({
  t: "text",
  x,
  y,
  text: s,
  anchor: "middle",
  cls: "glyph",
});
/** Vertical leads from the top and bottom edges to a body spanning y0..y1 */
export const leads = (y0: number, y1: number): Prim[] => [line(m, 0, m, y0), line(m, y1, m, S)];
export const leadTop = (y1: number): Prim => line(m, 0, m, y1);
export const leadBottom = (y0: number): Prim => line(m, y0, m, S);
export const mid = m;
