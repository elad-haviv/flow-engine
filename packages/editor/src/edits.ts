import type { ApplyContext, ParamValue, Cable } from "@flow/model";
import { DEFAULT_CABLE, DESIGNATORS, ROLE_OF_SYSTEM, STARTER_PARAMS } from "./defaults";
import { VIEW, snap, systemOf } from "./layout";
import type { EditorState } from "./state";
import { transact } from "./transaction";

export function placeDevice(s: EditorState, ctx: ApplyContext, kind: string, x: number, y: number): EditorState {
  const n = s.project.devices.filter((d) => d.kind === kind).length + 1;
  return transact(s, ctx, (tx) => {
    const p = tx.run("device.add", {
      kind,
      name: `${DESIGNATORS[kind] ?? kind}${n}`,
      params: STARTER_PARAMS[kind] ?? {},
    });
    const id = p?.devices.at(-1)?.id;
    if (id) tx.run("placement.set", { placement: { viewId: VIEW, entityId: id, x: snap(x), y: snap(y), rotation: 0 } });
  });
}

export function moveEntities(s: EditorState, ctx: ApplyContext, ids: string[], dx: number, dy: number): EditorState {
  return transact(s, ctx, (tx) => {
    for (const id of ids) {
      const pl = tx.project.placements.find((x) => x.entityId === id && x.viewId === VIEW);
      if (pl) tx.run("placement.set", { placement: { ...pl, x: snap(pl.x + dx), y: snap(pl.y + dy) } });
    }
  });
}

export function connect(s: EditorState, ctx: ApplyContext, from: string, to: string): EditorState {
  if (from === to) return s;
  const role = ROLE_OF_SYSTEM[systemOf(s.project, from)];
  const conductor = {
    role,
    sectionMm2: DEFAULT_CABLE.sectionMm2,
    material: "Cu" as const,
    insulation: "PVC" as const,
    origin: "default" as const,
  };
  return transact(s, ctx, (tx) => {
    tx.run("wire.add", {
      cable: { lengthM: DEFAULT_CABLE.lengthM, installation: DEFAULT_CABLE.installation, conductors: [conductor] },
      from: { terminalId: from },
      to: { terminalId: to },
    });
  });
}

export function deleteEntities(s: EditorState, ctx: ApplyContext, ids: string[]): EditorState {
  const wires = ids.filter((id) => s.project.wires.some((w) => w.id === id));
  const devices = ids.filter((id) => s.project.devices.some((d) => d.id === id));
  return {
    ...transact(s, ctx, (tx) => {
      for (const id of wires) tx.run("wire.remove", { wireId: id });
      for (const id of devices) tx.run("device.remove", { deviceId: id });
    }),
    selection: [],
  };
}

export const setParam = (
  s: EditorState,
  ctx: ApplyContext,
  deviceId: string,
  field: string,
  value: ParamValue,
): EditorState => transact(s, ctx, (tx) => void tx.run("device.setParam", { deviceId, field, value }));

export const renameDevice = (s: EditorState, ctx: ApplyContext, deviceId: string, name: string): EditorState =>
  transact(s, ctx, (tx) => void tx.run("device.rename", { deviceId, name }));

export const setState = (
  s: EditorState,
  ctx: ApplyContext,
  deviceId: string,
  state: "closed" | "open" | "grounded",
): EditorState => transact(s, ctx, (tx) => void tx.run("device.setState", { deviceId, state }));

export function setCable(
  s: EditorState,
  ctx: ApplyContext,
  cableId: string,
  change: {
    lengthM?: number;
    installation?: string;
    sectionMm2?: number;
    material?: "Cu" | "Al";
    insulation?: "PVC" | "XLPE";
  },
): EditorState {
  const cable = s.project.cables.find((c) => c.id === cableId) as Cable | undefined;
  return transact(s, ctx, (tx) => {
    if (change.lengthM !== undefined) tx.run("cable.set", { cableId, field: "lengthM", value: change.lengthM });
    if (change.installation !== undefined)
      tx.run("cable.set", { cableId, field: "installation", value: change.installation });
    for (const c of cable?.conductors ?? []) {
      if (change.sectionMm2 !== undefined)
        tx.run("cable.setConductor", { cableId, role: c.role, field: "sectionMm2", value: change.sectionMm2 });
      if (change.material !== undefined)
        tx.run("cable.setConductor", { cableId, role: c.role, field: "material", value: change.material });
      if (change.insulation !== undefined)
        tx.run("cable.setConductor", { cableId, role: c.role, field: "insulation", value: change.insulation });
    }
  });
}
