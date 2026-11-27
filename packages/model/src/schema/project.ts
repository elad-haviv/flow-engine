import { z } from "zod";
import { idSchema } from "./common";
import {
  annotationSchema, cableSchema, terminalSchema, circuitSchema, deviceSchema, junctionSchema,
  panelSchema, placementSchema, wireSchema,
} from "./entities";

export const SCHEMA_VERSION = 1;

export const projectSchema = z.object({
  id: idSchema,
  name: z.string(),
  locale: z.enum(["he", "en"]),
  profile: z.object({ id: z.string(), edition: z.string() }),
  schemaVersion: z.number().int().positive(),
  devices: z.array(deviceSchema),
  terminals: z.array(terminalSchema),
  cables: z.array(cableSchema),
  wires: z.array(wireSchema),
  junctions: z.array(junctionSchema),
  circuits: z.array(circuitSchema),
  panels: z.array(panelSchema),
  placements: z.array(placementSchema),
  annotations: z.array(annotationSchema),
});

export type Project = z.infer<typeof projectSchema>;
export type Device = z.infer<typeof deviceSchema>;
export type Terminal = z.infer<typeof terminalSchema>;
export type Cable = z.infer<typeof cableSchema>;
export type Wire = z.infer<typeof wireSchema>;
export type Junction = z.infer<typeof junctionSchema>;
export type Circuit = z.infer<typeof circuitSchema>;
export type Panel = z.infer<typeof panelSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type Endpoint = z.infer<typeof wireSchema>["from"];
