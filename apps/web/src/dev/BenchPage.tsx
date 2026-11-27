import { makeContext, buildScene, type Action } from "@flow/editor";
import {
  applyCommand,
  createProject,
  type Command,
  type CommandPayloads,
  type CommandType,
  type Project,
} from "@flow/model";
import { SceneView } from "@flow/ui";
import { useMemo, useState } from "react";

const ctx = makeContext();
const cmd = <T extends CommandType>(type: T, payload: CommandPayloads[T]): Command =>
  ({ id: ctx.newId(), type, v: 1, at: ctx.now(), by: "bench", payload }) as Command;

function chain(n: number): Project {
  let p = createProject("bench", "en", { id: "il", edition: "2026" });
  const run = (c: Command) => {
    const r = applyCommand(p, c, ctx);
    if (r.ok) p = r.project;
  };
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    run(cmd("device.add", { kind: "breaker", name: `Q${i}`, params: {} }));
    const id = p.devices.at(-1)!.id;
    ids.push(id);
    run(
      cmd("placement.set", {
        placement: { viewId: "main", entityId: id, x: (i % 50) * 100, y: Math.floor(i / 50) * 140, rotation: 0 },
      }),
    );
  }
  const term = (id: string, role: string) => p.terminals.find((t) => t.deviceId === id && t.role === role)!.id;
  const conductor = { role: "L1" as const, sectionMm2: 10, material: "Cu" as const, insulation: "PVC" as const };
  for (let i = 1; i < n; i++) {
    if (i % 50 === 0) continue;
    run(
      cmd("wire.add", {
        cable: { lengthM: 5, installation: "C", conductors: [conductor] },
        from: { terminalId: term(ids[i - 1]!, "out") },
        to: { terminalId: term(ids[i]!, "in") },
      }),
    );
  }
  return p;
}

/** Measures frame time while panning a large diagram, with and without culling. The result is recorded in the Phase 2 exit report. */
export function BenchPage() {
  const n = Number(new URLSearchParams(location.search).get("n") ?? 1000);
  const project = useMemo(() => chain(n), [n]);
  const scene = useMemo(() => buildScene(project), [project]);
  const [out, setOut] = useState("");
  const [cull, setCull] = useState(true);
  const noop: Action["type"] = "cancel";
  void noop;
  const measure = async (c: boolean) => {
    setCull(c);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const svg = document.querySelector("svg.scene")!;
    const frames: number[] = [];
    let last = performance.now();
    for (let i = 0; i < 60; i++) {
      const [x, y, w, h] = (svg.getAttribute("viewBox") ?? "0 0 800 520").split(" ").map(Number) as [
        number,
        number,
        number,
        number,
      ];
      svg.dispatchEvent(
        new WheelEvent("wheel", { deltaY: i % 2 ? -50 : 50, clientX: 300, clientY: 200, bubbles: true }),
      );
      void x;
      void y;
      void w;
      void h;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const now = performance.now();
      frames.push(now - last);
      last = now;
    }
    frames.sort((a, b) => a - b);
    return { mean: frames.reduce((s, f) => s + f, 0) / frames.length, p95: frames[Math.floor(frames.length * 0.95)]! };
  };
  const run = async () => {
    const culled = await measure(true);
    const all = await measure(false);
    setOut(JSON.stringify({ devices: n, elements: scene.elements.length, culled, all }));
  };
  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <p>
        <button id="bench-run" onClick={() => void run()}>
          {"run"}
        </button>{" "}
        <output id="bench-result">{out}</output> <span>{`${cull ? "culled" : "all"}`}</span>
      </p>
      <SceneView
        scene={scene}
        selection={[]}
        markers={[]}
        tool="select"
        ariaLabel="bench"
        cull={cull}
        onSelect={() => undefined}
        onPlace={() => undefined}
        onWireClick={() => undefined}
        onMove={() => undefined}
      />
    </div>
  );
}
