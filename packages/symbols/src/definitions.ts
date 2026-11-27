import type { Prim } from "@flow/scene";
import { circle, leadBottom, leadTop, leads, line, mid, rect, text, S } from "./draw";
import type { Anchor, Symbol } from "./types";

const top: Anchor = { p: { x: mid, y: 0 }, side: "top" };
const bottom: Anchor = { p: { x: mid, y: S }, side: "bottom" };
const right: Anchor = { p: { x: S, y: mid }, side: "right" };
const left: Anchor = { p: { x: 0, y: mid }, side: "left" };

const sym = (prims: Prim[], anchors: Symbol["anchors"]): Symbol => ({ w: S, h: S, prims, anchors });
const body = (g: string): Prim[] => [circle(mid, mid, 18), text(mid, mid + 5, g)];
const box = (g: string): Prim[] => [rect(12, 15, 36, 30), text(mid, mid + 5, g)];

export const SYMBOLS: Record<string, Symbol> = {
  grid: sym(
    [
      leadTop(0),
      circle(mid, 24, 16),
      {
        t: "polyline",
        points: [
          { x: 20, y: 24.0 },
          { x: 21.25, y: 22.09 },
          { x: 22.5, y: 20.46 },
          { x: 23.75, y: 19.38 },
          { x: 25, y: 19.0 },
          { x: 26.25, y: 19.38 },
          { x: 27.5, y: 20.46 },
          { x: 28.75, y: 22.09 },
          { x: 30, y: 24.0 },
          { x: 31.25, y: 25.91 },
          { x: 32.5, y: 27.54 },
          { x: 33.75, y: 28.62 },
          { x: 35, y: 29.0 },
          { x: 36.25, y: 28.62 },
          { x: 37.5, y: 27.54 },
          { x: 38.75, y: 25.91 },
          { x: 40, y: 24.0 },
        ],
        cls: "wave",
      },
      leadBottom(40),
    ],
    { out: bottom },
  ),
  generator: sym([...body("G"), leadBottom(48)], { out: bottom }),
  battery: sym([line(14, 24, 46, 24), line(22, 32, 38, 32), line(14, 40, 46, 40), leadBottom(40)], { out: bottom }),
  solar_array: sym([rect(10, 10, 40, 30), line(10, 40, 50, 10), leadBottom(40)], { out: bottom }),
  breaker: sym([...leads(15, 45), rect(18, 15, 24, 30), line(18, 15, 42, 45), line(18, 45, 42, 15)], {
    in: top,
    out: bottom,
  }),
  fuse: sym([...leads(15, 45), rect(22, 15, 16, 30), line(mid, 15, mid, 45)], { in: top, out: bottom }),
  contactor: sym([...leads(15, 45), circle(mid, 21, 3), line(mid, 21, 40, 40), line(mid, 45, mid, 40)], {
    in: top,
    out: bottom,
  }),
  disconnector: sym([...leads(18, 42), line(mid, 42, 42, 20)], { in: top, out: bottom }),
  meter: sym([...leads(12, 48), circle(mid, mid, 18), text(mid, mid + 5, "kWh")], { in: top, out: bottom }),
  earthing_disconnector: sym(
    [
      leadTop(24),
      line(mid, 24, 42, 12),
      line(mid, 36, mid, 38),
      line(14, 38, 46, 38),
      line(20, 44, 40, 44),
      line(26, 50, 34, 50),
    ],
    { in: top },
  ),
  busbar: {
    w: 120,
    h: 10,
    prims: [rect(0, 2, 120, 6)],
    anchors: { bus: { p: { x: 60, y: 5 }, side: "top" } },
    bar: true,
  },
  transformer: sym([leadTop(10), circle(mid, 24, 14), circle(mid, 38, 14), leadBottom(52)], { in: top, out: bottom }),
  rectifier: sym([...leads(15, 45), ...box("AC/DC")], { in: top, out: bottom }),
  inverter: sym([...leads(15, 45), ...box("DC/AC")], { in: top, out: bottom }),
  cc_regulator: sym([leadTop(15), leadBottom(45), ...box("CCR"), line(48, mid, S, mid), line(0, mid, 12, mid)], {
    in: top,
    out: bottom,
    return: right,
  }),
  load: sym([leadTop(18), rect(18, 18, 24, 24), line(mid, 42, mid, 52), line(24, 52, 36, 52)], { in: top }),
  motor: sym([leadTop(12), ...body("M")], { in: top }),
  capacitor: sym([leadTop(26), line(16, 26, 44, 26), line(16, 34, 44, 34), leadBottom(34)], { in: top }),
  series_load: sym([line(0, mid, 12, mid), circle(mid, mid, 18), line(48, mid, S, mid), line(18, 18, 42, 42)], {
    in: left,
    out: right,
  }),
};
