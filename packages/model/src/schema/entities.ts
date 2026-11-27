import { z } from "zod";
import { idSchema, paramsSchema } from "./common";

export const deviceSchema = z.object({
  id: idSchema,
  kind: z.string().min(1),
  name: z.string(),
  params: paramsSchema,
  state: z.enum(["closed", "open", "grounded"]).optional(),
});

export const terminalSchema = z.object({
  id: idSchema,
  deviceId: idSchema,
  role: z.enum(["in", "out", "return", "earth", "bus"]),
  conductors: z.array(z.string()),
});

export const CONDUCTOR_ROLES = ["L1", "L2", "L3", "N", "PE", "L", "DC+", "DC-"] as const;
export const conductorSchema = z.object({
  role: z.enum(CONDUCTOR_ROLES),
  sectionMm2: z.number().positive(),
  material: z.enum(["Cu", "Al"]),
  insulation: z.enum(["PVC", "XLPE", "none"]),
  origin: z.enum(["entered", "catalog", "standard", "default"]).optional(),
});

export const cableSchema = z.object({
  id: idSchema,
  lengthM: z.number().nonnegative(),
  installation: z.string(),
  catalogRef: z.string().optional(),
  conductors: z.array(conductorSchema).min(1),
});

export const endpointSchema = z.union([z.object({ terminalId: idSchema }), z.object({ junctionId: idSchema })]);

export const wireSchema = z.object({
  id: idSchema,
  cableId: idSchema,
  from: endpointSchema,
  to: endpointSchema,
});

export const junctionSchema = z.object({
  id: idSchema,
  name: z.string().optional(),
  ratingA: z.number().positive().optional(),
  terminalId: idSchema.optional(),
});

export const circuitSchema = z.object({
  id: idSchema,
  panelId: idSchema.optional(),
  way: z.number().int().positive().optional(),
  phase: z.enum(["L1", "L2", "L3"]).optional(),
  members: z.array(idSchema),
  overrides: paramsSchema,
});

export const panelSchema = z.object({ id: idSchema, name: z.string(), enclosure: z.string().optional() });

export const placementSchema = z.object({
  id: idSchema,
  viewId: z.string(),
  entityId: idSchema,
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  w: z.number().optional(),
  h: z.number().optional(),
  waypoints: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
});

export const annotationSchema = z.object({
  id: idSchema,
  type: z.enum(["text", "rect", "ellipse", "arrow"]),
  placement: placementSchema.omit({ id: true, entityId: true, viewId: true }).extend({ viewId: z.string() }),
  style: z.record(z.string(), z.string()),
  text: z.string().optional(),
});
