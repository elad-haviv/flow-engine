import { CODES } from "../diagnostics/codes";
import type { Annotation, Circuit, Junction, Placement } from "../schema/project";
import { nodeKey } from "../topology";
import { add, fail, find, ok, remove, update, wiresAt, type Handler } from "./handlers";

export const junctionPromote: Handler<"junction.promote"> = (p, pl, ctx) => {
  if (!find(p, "terminals", pl.terminalId)) return fail(CODES.junctionNotApplicable, [pl.terminalId]);
  if (p.junctions.some((j) => j.terminalId === pl.terminalId))
    return fail(CODES.junctionNotApplicable, [pl.terminalId]);
  const wires = wiresAt(p, pl.terminalId);
  if (wires.length === 0) return fail(CODES.junctionNotApplicable, [pl.terminalId]);
  const j: Junction = {
    id: ctx.newId(),
    terminalId: pl.terminalId,
    ...(pl.name !== undefined ? { name: pl.name } : {}),
    ...(pl.ratingA !== undefined ? { ratingA: pl.ratingA } : {}),
  };
  const swap = (e: (typeof wires)[number]["from"]) => (nodeKey(p, e) === pl.terminalId ? { junctionId: j.id } : e);
  return ok([
    add("junctions", j),
    ...wires.map((w) => update(p, "wires", w.id, { ...w, from: swap(w.from), to: swap(w.to) })),
  ]);
};

export const junctionDemote: Handler<"junction.demote"> = (p, pl) => {
  const j = find<Junction>(p, "junctions", pl.junctionId);
  if (!j || !j.terminalId) return fail(CODES.junctionNotApplicable, [pl.junctionId]);
  if (j.name !== undefined || j.ratingA !== undefined) return fail(CODES.junctionHasData, [j.id]);
  const back = (e: { junctionId: string } | { terminalId: string }) =>
    "junctionId" in e && e.junctionId === j.id ? { terminalId: j.terminalId! } : e;
  const wires = p.wires.filter(
    (w) => ("junctionId" in w.from && w.from.junctionId === j.id) || ("junctionId" in w.to && w.to.junctionId === j.id),
  );
  return ok([
    ...wires.map((w) => update(p, "wires", w.id, { ...w, from: back(w.from), to: back(w.to) })),
    remove(p, "junctions", j.id),
  ]);
};

const memberExists = (p: Parameters<Handler<"circuit.create">>[0], id: string): boolean =>
  !!find(p, "devices", id) || !!find(p, "cables", id);

export const circuitCreate: Handler<"circuit.create"> = (p, pl, ctx) =>
  pl.circuit.members.every((m) => memberExists(p, m))
    ? ok([add("circuits", { id: ctx.newId(), ...pl.circuit } as Circuit)])
    : fail(CODES.circuitMemberMissing);

export const circuitSetMembers: Handler<"circuit.setMembers"> = (p, pl) => {
  const c = find<Circuit>(p, "circuits", pl.circuitId);
  if (!c) return fail(CODES.circuitNotFound, [pl.circuitId]);
  if (!pl.members.every((m) => memberExists(p, m))) return fail(CODES.circuitMemberMissing, [c.id]);
  return ok([update(p, "circuits", c.id, { ...c, members: pl.members } as Circuit)]);
};

export const circuitRemove: Handler<"circuit.remove"> = (p, pl) =>
  find(p, "circuits", pl.circuitId)
    ? ok([remove(p, "circuits", pl.circuitId)])
    : fail(CODES.circuitNotFound, [pl.circuitId]);

export const placementSet: Handler<"placement.set"> = (p, pl, ctx) => {
  const e = pl.placement.entityId;
  if (!find(p, "devices", e) && !find(p, "cables", e) && !find(p, "wires", e) && !find(p, "junctions", e))
    return fail(CODES.placementEntityMissing, [e]);
  const existing = pl.placement.id ? find<Placement>(p, "placements", pl.placement.id) : undefined;
  const next = { ...pl.placement, id: pl.placement.id ?? ctx.newId() } as Placement;
  return ok([existing ? update(p, "placements", existing.id, next) : add("placements", next)]);
};

export const annotationAdd: Handler<"annotation.add"> = (_p, pl, ctx) =>
  ok([add("annotations", { id: ctx.newId(), ...pl.annotation } as Annotation)]);

export const annotationSet: Handler<"annotation.set"> = (p, pl) =>
  find(p, "annotations", pl.annotation.id)
    ? ok([update(p, "annotations", pl.annotation.id, pl.annotation)])
    : fail(CODES.annotationNotFound, [pl.annotation.id]);

export const annotationRemove: Handler<"annotation.remove"> = (p, pl) =>
  find(p, "annotations", pl.annotationId)
    ? ok([remove(p, "annotations", pl.annotationId)])
    : fail(CODES.annotationNotFound, [pl.annotationId]);
