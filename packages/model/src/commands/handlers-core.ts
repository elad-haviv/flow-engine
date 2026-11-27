import { CODES } from "../diagnostics/codes";
import type { Cable, Device, Terminal } from "../schema/project";
import { add, endpointExists, fail, find, ok, remove, update, type Handler } from "./handlers";

export const projectRename: Handler<"project.rename"> = (p, pl) =>
  pl.name.trim() === "" ? fail(CODES.projectNameEmpty)
    : ok([{ coll: "project", id: p.id, before: { name: p.name }, after: { name: pl.name } }]);

export const deviceAdd: Handler<"device.add"> = (_p, pl, ctx) => {
  const terms = ctx.terminalsFor(pl.kind);
  if (!terms) return fail(CODES.deviceKindUnknown);
  for (const [f, v] of Object.entries(pl.params)) if (!ctx.paramValid(pl.kind, f, v)) return fail(CODES.deviceParamInvalid);
  const device: Device = { id: ctx.newId(), kind: pl.kind, name: pl.name, params: pl.params };
  const tChanges = terms.map((t): Terminal => ({ id: ctx.newId(), deviceId: device.id, role: t.role, conductors: t.conductors }));
  return ok([add("devices", device), ...tChanges.map((t) => add("terminals", t))]);
};

export const deviceRemove: Handler<"device.remove"> = (p, pl) => {
  const d = find<Device>(p, "devices", pl.deviceId);
  if (!d) return fail(CODES.deviceNotFound, [pl.deviceId]);
  const terms = p.terminals.filter((t) => t.deviceId === d.id);
  const ids = new Set(terms.map((t) => t.id));
  const wires = p.wires.filter((w) => ("terminalId" in w.from && ids.has(w.from.terminalId)) || ("terminalId" in w.to && ids.has(w.to.terminalId)));
  const junctions = p.junctions.filter((j) => j.terminalId && ids.has(j.terminalId));
  return ok([
    ...wires.map((w) => remove(p, "wires", w.id)),
    ...junctions.map((j) => remove(p, "junctions", j.id)),
    ...terms.map((t) => remove(p, "terminals", t.id)),
    remove(p, "devices", d.id),
  ]);
};

export const deviceSetParam: Handler<"device.setParam"> = (p, pl, ctx) => {
  const d = find<Device>(p, "devices", pl.deviceId);
  if (!d) return fail(CODES.deviceNotFound, [pl.deviceId]);
  if (!ctx.paramValid(d.kind, pl.field, pl.value)) return fail(CODES.deviceParamInvalid, [d.id]);
  return ok([update(p, "devices", d.id, { ...d, params: { ...d.params, [pl.field]: pl.value } } as Device)]);
};

export const deviceSetState: Handler<"device.setState"> = (p, pl, ctx) => {
  const d = find<Device>(p, "devices", pl.deviceId);
  if (!d) return fail(CODES.deviceNotFound, [pl.deviceId]);
  if (!ctx.stateValid(d.kind, pl.state)) return fail(CODES.deviceStateInvalid, [d.id]);
  return ok([update(p, "devices", d.id, { ...d, state: pl.state } as Device)]);
};

export const wireAdd: Handler<"wire.add"> = (p, pl, ctx) => {
  if (!endpointExists(p, pl.from) || !endpointExists(p, pl.to)) return fail(CODES.wireEndpointMissing);
  const roles = (e: typeof pl.from): string[] | undefined => ("terminalId" in e ? find<Terminal>(p, "terminals", e.terminalId)?.conductors : undefined);
  const check = (e: typeof pl.from): boolean => {
    const allowed = roles(e);
    return !allowed || allowed.length === 0 || pl.cable.conductors.every((c) => allowed.includes(c.role));
  };
  if (!check(pl.from) || !check(pl.to)) return fail(CODES.wireConductorMismatch);
  const cable: Cable = { id: ctx.newId(), ...pl.cable };
  return ok([add("cables", cable), add("wires", { id: ctx.newId(), cableId: cable.id, from: pl.from, to: pl.to })]);
};

export const wireRemove: Handler<"wire.remove"> = (p, pl) => {
  const w = p.wires.find((x) => x.id === pl.wireId);
  if (!w) return fail(CODES.wireNotFound, [pl.wireId]);
  const shared = p.wires.some((x) => x.id !== w.id && x.cableId === w.cableId);
  return ok([remove(p, "wires", w.id), ...(shared ? [] : [remove(p, "cables", w.cableId)])]);
};

export const cableSetConductor: Handler<"cable.setConductor"> = (p, pl) => {
  const c = find<Cable>(p, "cables", pl.cableId);
  if (!c) return fail(CODES.cableNotFound, [pl.cableId]);
  const i = c.conductors.findIndex((x) => x.role === pl.role);
  if (i < 0) return fail(CODES.cableConductorInvalid, [c.id]);
  const next = { ...c.conductors[i]!, [pl.field]: pl.value, origin: "entered" as const };
  const ok2 = pl.field === "sectionMm2" ? typeof pl.value === "number" && pl.value > 0
    : pl.field === "material" ? pl.value === "Cu" || pl.value === "Al"
    : pl.value === "PVC" || pl.value === "XLPE" || pl.value === "none";
  if (!ok2) return fail(CODES.cableConductorInvalid, [c.id]);
  const conductors = c.conductors.map((x, k) => (k === i ? (next as typeof x) : x));
  return ok([update(p, "cables", c.id, { ...c, conductors } as Cable)]);
};
