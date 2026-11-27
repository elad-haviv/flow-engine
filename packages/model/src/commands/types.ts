import type { Annotation, Circuit, Placement } from "../schema/project";
import type { Quantity } from "../units";
import type { Endpoint } from "../schema/project";
import type { z } from "zod";
import type { conductorSchema } from "../schema/entities";

export type ParamValue = Quantity | number | string | boolean;
type ConductorSpec = z.infer<typeof conductorSchema>;

export interface CommandPayloads {
  "project.create": { name: string; locale: "he" | "en"; profile: { id: string; edition: string } };
  "project.rename": { name: string };
  "device.add": { kind: string; name: string; params: Record<string, ParamValue> };
  "device.rename": { deviceId: string; name: string };
  "device.remove": { deviceId: string };
  "device.setParam": { deviceId: string; field: string; value: ParamValue };
  "device.setState": { deviceId: string; state: "closed" | "open" | "grounded" };
  "wire.add": {
    cable: { lengthM: number; installation: string; conductors: ConductorSpec[] };
    from: Endpoint;
    to: Endpoint;
  };
  "wire.remove": { wireId: string };
  "cable.set": { cableId: string; field: "lengthM" | "installation"; value: string | number };
  "cable.setConductor": {
    cableId: string;
    role: string;
    field: "sectionMm2" | "material" | "insulation";
    value: string | number;
  };
  "junction.promote": { terminalId: string; name?: string; ratingA?: number };
  "junction.demote": { junctionId: string };
  "circuit.create": { circuit: Omit<Circuit, "id"> };
  "circuit.setMembers": { circuitId: string; members: string[] };
  "circuit.remove": { circuitId: string };
  "placement.set": { placement: Omit<Placement, "id"> & { id?: string } };
  "annotation.add": { annotation: Omit<Annotation, "id"> };
  "annotation.set": { annotation: Annotation };
  "annotation.remove": { annotationId: string };
  batch: { commands: Command[] };
}

export type CommandType = keyof CommandPayloads;

export interface Command<T extends CommandType = CommandType> {
  id: string;
  type: T;
  v: number;
  at: string;
  by: string;
  /** Ids generated while applying, recorded so a replay reproduces the same model. */
  ids?: string[];
  payload: CommandPayloads[T];
}
