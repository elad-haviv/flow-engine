import { hitTest, rectsOverlap, type Point, type Prim, type Scene, type SceneElement } from "@flow/scene";
import { isolate } from "@flow/i18n";
import { useRef, useState, type PointerEvent as RPE, type WheelEvent } from "react";

export interface SceneViewProps {
  scene: Scene;
  selection: string[];
  /** Dots to draw on terminals while wiring */
  markers: Array<{ terminalId: string; p: Point }>;
  tool: "select" | "place" | "wire" | "annotate";
  ariaLabel: string;
  onSelect: (ids: string[]) => void;
  onPlace: (p: Point) => void;
  onWireClick: (p: Point) => void;
  onMove: (ids: string[], dx: number, dy: number) => void;
  showGrid?: boolean;
  /** Draw only what overlaps the view (default true) */
  cull?: boolean;
}

interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

function PrimView({ p }: { p: Prim }) {
  const cls = p.cls ? `s-${p.cls}` : "s-stroke";
  switch (p.t) {
    case "line":
      return <line className={cls} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />;
    case "rect":
      return <rect className={cls} x={p.x} y={p.y} width={p.w} height={p.h} />;
    case "ellipse":
      return <ellipse className={cls} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} />;
    case "circle":
      return <circle className={cls} cx={p.cx} cy={p.cy} r={p.r} />;
    case "path":
      return <path className={cls} d={p.d} />;
    case "polyline":
      return <polyline className={cls} points={p.points.map((q) => `${q.x},${q.y}`).join(" ")} />;
    case "text":
      return (
        <text className={cls} x={p.x} y={p.y} textAnchor={p.anchor ?? "start"}>
          {isolate(p.text)}
        </text>
      );
  }
}

function ElementView({ e, selected, offset }: { e: SceneElement; selected: boolean; offset?: Point }) {
  const cls = ["el", `el-${e.layer}`, selected ? "selected" : "", e.status ? `status-${e.status}` : ""].join(" ");
  return (
    <g
      className={cls}
      data-id={e.entityId}
      data-testid={`el-${e.layer}`}
      transform={offset ? `translate(${offset.x} ${offset.y})` : undefined}
    >
      {e.prims.map((p, i) => (
        <PrimView key={i} p={p} />
      ))}
    </g>
  );
}

export function SceneView(props: SceneViewProps) {
  const { scene, selection, markers, tool } = props;
  const [view, setView] = useState<View>({ x: -40, y: -40, w: 800, h: 520 });
  const [drag, setDrag] = useState<{ ids: string[]; from: Point; delta: Point } | null>(null);
  const [pan, setPan] = useState<{ from: Point; view: View } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  /** Screen to diagram coordinates. The viewBox is fitted with preserveAspectRatio, so scale is uniform and the view is centred. */
  const fit = () => {
    const r = svg.current!.getBoundingClientRect();
    const k = Math.min(r.width / view.w, r.height / view.h);
    return { r, k, ox: (r.width - view.w * k) / 2, oy: (r.height - view.h * k) / 2 };
  };
  const world = (e: { clientX: number; clientY: number }): Point => {
    const { r, k, ox, oy } = fit();
    return { x: view.x + (e.clientX - r.left - ox) / k, y: view.y + (e.clientY - r.top - oy) / k };
  };

  const down = (e: RPE) => {
    const w = world(e);
    const hit = hitTest(scene.elements, w);
    if (tool === "place" || tool === "annotate") return props.onPlace(w);
    if (tool === "wire") return props.onWireClick(w);
    if (hit) {
      const ids = selection.includes(hit.entityId) ? selection : [hit.entityId];
      props.onSelect(ids);
      if (hit.layer === "device") setDrag({ ids, from: w, delta: { x: 0, y: 0 } });
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } else {
      props.onSelect([]);
      setPan({ from: { x: e.clientX, y: e.clientY }, view });
    }
  };
  const move = (e: RPE) => {
    if (drag) {
      const w = world(e);
      setDrag({ ...drag, delta: { x: w.x - drag.from.x, y: w.y - drag.from.y } });
    } else if (pan) {
      const { k } = fit();
      setView({
        ...pan.view,
        x: pan.view.x - (e.clientX - pan.from.x) / k,
        y: pan.view.y - (e.clientY - pan.from.y) / k,
      });
    }
  };
  const up = () => {
    if (drag && (Math.abs(drag.delta.x) > 3 || Math.abs(drag.delta.y) > 3))
      props.onMove(drag.ids, drag.delta.x, drag.delta.y);
    setDrag(null);
    setPan(null);
  };
  const wheel = (e: WheelEvent) => {
    const k = e.deltaY > 0 ? 1.1 : 1 / 1.1;
    const w = world(e);
    setView({ x: w.x - (w.x - view.x) * k, y: w.y - (w.y - view.y) * k, w: view.w * k, h: view.h * k });
  };

  const margin = 100;
  const area = { x: view.x - margin, y: view.y - margin, w: view.w + 2 * margin, h: view.h + 2 * margin };
  const shown =
    props.cull === false
      ? scene.elements
      : scene.elements.filter((e) => selection.includes(e.entityId) || rectsOverlap(e.bounds, area));

  return (
    <svg
      ref={svg}
      className={`scene tool-${tool}`}
      role="img"
      aria-label={props.ariaLabel}
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      direction="ltr"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onWheel={wheel}
    >
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" className="s-grid" />
        </pattern>
      </defs>
      {props.showGrid !== false && (
        <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="url(#grid)" pointerEvents="none" />
      )}
      {shown.map((e) => (
        <ElementView
          key={e.id}
          e={e}
          selected={selection.includes(e.entityId)}
          {...(drag && e.layer === "device" && drag.ids.includes(e.entityId) ? { offset: drag.delta } : {})}
        />
      ))}
      {tool === "wire" &&
        markers.map((m) => (
          <circle key={m.terminalId} className="s-marker" cx={m.p.x} cy={m.p.y} r={5} data-testid="marker" />
        ))}
    </svg>
  );
}
