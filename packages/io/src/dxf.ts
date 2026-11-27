import type { Point, Prim, Scene, SceneLayer } from "@flow/scene";

const LAYERS: Record<SceneLayer, { name: string; color: number }> = {
  zone: { name: "ZONES", color: 5 },
  wire: { name: "WIRES", color: 7 },
  device: { name: "DEVICES", color: 7 },
  annotation: { name: "NOTES", color: 3 },
};
const TEXT_HEIGHT = 8;

/** DXF text carries non-ASCII characters as \U+XXXX. Bidirectional control marks are dropped. */
export function dxfText(s: string): string {
  return [...s.replace(/[⁦-⁩‎‏]/g, "")]
    .map((ch) => (ch.charCodeAt(0) > 126 ? `\\U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}` : ch))
    .join("");
}

const num = (n: number): string => String(Math.round(n * 1000) / 1000);
const pair = (code: number, value: string | number): string => `${code}\n${value}\n`;

function line(layer: string, a: Point, b: Point): string {
  return (
    pair(0, "LINE") +
    pair(8, layer) +
    pair(10, num(a.x)) +
    pair(20, num(-a.y)) +
    pair(30, 0) +
    pair(11, num(b.x)) +
    pair(21, num(-b.y)) +
    pair(31, 0)
  );
}

function polyline(layer: string, pts: Point[], closed = false): string {
  const segs = pts.slice(1).map((p, i) => line(layer, pts[i]!, p));
  if (closed && pts.length > 2) segs.push(line(layer, pts[pts.length - 1]!, pts[0]!));
  return segs.join("");
}

function ellipse(cx: number, cy: number, rx: number, ry: number): Point[] {
  return Array.from({ length: 37 }, (_, i) => ({
    x: cx + rx * Math.cos((i / 36) * 2 * Math.PI),
    y: cy + ry * Math.sin((i / 36) * 2 * Math.PI),
  }));
}

function text(layer: string, p: Prim & { t: "text" }): string {
  const centered = p.anchor === "middle";
  const align = centered ? pair(72, 1) + pair(11, num(p.x)) + pair(21, num(-p.y)) + pair(31, 0) : "";
  return (
    pair(0, "TEXT") +
    pair(8, layer) +
    pair(10, num(p.x)) +
    pair(20, num(-p.y)) +
    pair(30, 0) +
    pair(40, TEXT_HEIGHT) +
    pair(1, dxfText(p.text)) +
    align
  );
}

function prim(layer: string, p: Prim): string {
  switch (p.t) {
    case "line":
      return line(layer, { x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 });
    case "rect":
      return polyline(
        layer,
        [
          { x: p.x, y: p.y },
          { x: p.x + p.w, y: p.y },
          { x: p.x + p.w, y: p.y + p.h },
          { x: p.x, y: p.y + p.h },
        ],
        true,
      );
    case "circle":
      return (
        pair(0, "CIRCLE") +
        pair(8, layer) +
        pair(10, num(p.cx)) +
        pair(20, num(-p.cy)) +
        pair(30, 0) +
        pair(40, num(p.r))
      );
    case "ellipse":
      return polyline(layer, ellipse(p.cx, p.cy, p.rx, p.ry));
    case "polyline":
      return polyline(layer, p.points);
    case "text":
      return text(layer, p);
    case "path":
      return "";
  }
}

/** Drawing as ASCII DXF (R12 entities). One layer per diagram layer; y is flipped because CAD has y up. */
export function toDxf(scene: Scene): string {
  const layers = Object.values(LAYERS);
  const head =
    pair(0, "SECTION") +
    pair(2, "HEADER") +
    pair(9, "$ACADVER") +
    pair(1, "AC1009") +
    pair(0, "ENDSEC") +
    pair(0, "SECTION") +
    pair(2, "TABLES") +
    pair(0, "TABLE") +
    pair(2, "LTYPE") +
    pair(70, 1) +
    pair(0, "LTYPE") +
    pair(2, "CONTINUOUS") +
    pair(70, 0) +
    pair(3, "Solid line") +
    pair(72, 65) +
    pair(73, 0) +
    pair(40, "0.0") +
    pair(0, "ENDTAB") +
    pair(0, "TABLE") +
    pair(2, "LAYER") +
    pair(70, layers.length) +
    layers
      .map((l) => pair(0, "LAYER") + pair(2, l.name) + pair(70, 0) + pair(62, l.color) + pair(6, "CONTINUOUS"))
      .join("") +
    pair(0, "ENDTAB") +
    pair(0, "ENDSEC");
  const body = scene.elements.map((e) => e.prims.map((p) => prim(LAYERS[e.layer].name, p)).join("")).join("");
  return head + pair(0, "SECTION") + pair(2, "ENTITIES") + body + pair(0, "ENDSEC") + pair(0, "EOF");
}
