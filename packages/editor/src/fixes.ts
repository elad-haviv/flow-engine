import { nodeKey, type ApplyContext } from "@flow/model";
import { STARTER_PARAMS } from "./defaults";
import { VIEW, positionOf, snap } from "./layout";
import type { EditorState } from "./state";
import { transact } from "./transaction";

/**
 * One-click fix for "many wires on one terminal": put a busbar there.
 * The terminal gets one wire to the busbar; every other wire is re-attached to the busbar. Connectivity is unchanged.
 */
export function insertBusbar(s: EditorState, ctx: ApplyContext, terminalId: string): EditorState {
  const p = s.project;
  const t = p.terminals.find((x) => x.id === terminalId);
  const attached = p.wires.filter((w) => nodeKey(p, w.from) === terminalId || nodeKey(p, w.to) === terminalId);
  if (!t || attached.length < 2) return s;
  const owner = positionOf(p, t.deviceId);
  return transact(s, ctx, (tx) => {
    const after = tx.run("device.add", { kind: "busbar", name: "WA", params: STARTER_PARAMS["busbar"] ?? {} });
    const bar = after?.devices.at(-1);
    const barTerminal = bar && after?.terminals.find((x) => x.deviceId === bar.id);
    if (!bar || !barTerminal) return;
    const x = snap((owner?.x ?? 0) - 30);
    const y = snap((owner?.y ?? 0) + 120);
    tx.run("placement.set", { placement: { viewId: VIEW, entityId: bar.id, x, y, rotation: 0 } });
    const first = attached[0]!;
    const cable = p.cables.find((c) => c.id === first.cableId)!;
    const copy = { lengthM: cable.lengthM, installation: cable.installation, conductors: cable.conductors };
    tx.run("wire.add", { cable: copy, from: { terminalId }, to: { terminalId: barTerminal.id } });
    for (const w of attached) {
      const other = nodeKey(p, w.from) === terminalId ? w.to : w.from;
      const c = p.cables.find((x) => x.id === w.cableId)!;
      tx.run("wire.remove", { wireId: w.id });
      tx.run("wire.add", {
        cable: { lengthM: c.lengthM, installation: c.installation, conductors: c.conductors },
        from: { terminalId: barTerminal.id },
        to: other,
      });
    }
  });
}
