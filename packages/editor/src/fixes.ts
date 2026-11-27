import { nodeKey, type ApplyContext, type Project, type Wire } from "@flow/model";
import { STARTER_PARAMS } from "./defaults";
import { VIEW, positionOf, snap } from "./layout";
import type { EditorState } from "./state";
import { transact, type Tx } from "./transaction";

const cableCopy = (p: Project, cableId: string) => {
  const c = p.cables.find((x) => x.id === cableId)!;
  return { lengthM: c.lengthM, installation: c.installation, conductors: c.conductors };
};

/** Adds a busbar below the terminal's device and returns its terminal id. */
function addBar(tx: Tx, owner: { x: number; y: number } | undefined): string | undefined {
  const after = tx.run("device.add", { kind: "busbar", name: "WA", params: STARTER_PARAMS["busbar"] ?? {} });
  const bar = after?.devices.at(-1);
  const terminal = bar && after?.terminals.find((x) => x.deviceId === bar.id);
  if (!bar || !terminal) return undefined;
  const pos = { x: snap((owner?.x ?? 0) - 30), y: snap((owner?.y ?? 0) + 120) };
  tx.run("placement.set", { placement: { viewId: VIEW, entityId: bar.id, ...pos, rotation: 0 } });
  return terminal.id;
}

function rewire(tx: Tx, p: Project, attached: Wire[], terminalId: string, bar: string): void {
  tx.run("wire.add", { cable: cableCopy(p, attached[0]!.cableId), from: { terminalId }, to: { terminalId: bar } });
  for (const w of attached) {
    const other = nodeKey(p, w.from) === terminalId ? w.to : w.from;
    tx.run("wire.remove", { wireId: w.id });
    tx.run("wire.add", { cable: cableCopy(p, w.cableId), from: { terminalId: bar }, to: other });
  }
}

/**
 * One-click fix for "many wires on one terminal": put a busbar there.
 * The terminal gets one wire to the busbar; every other wire is re-attached to the busbar. Connectivity is unchanged.
 */
export function insertBusbar(s: EditorState, ctx: ApplyContext, terminalId: string): EditorState {
  const p = s.project;
  const t = p.terminals.find((x) => x.id === terminalId);
  const attached = p.wires.filter((w) => nodeKey(p, w.from) === terminalId || nodeKey(p, w.to) === terminalId);
  if (!t || attached.length < 2) return s;
  return transact(s, ctx, (tx) => {
    const bar = addBar(tx, positionOf(p, t.deviceId));
    if (bar) rewire(tx, p, attached, terminalId, bar);
  });
}
