import { z } from "zod";
import { UNITS } from "../units";

export const idSchema = z.string().length(26);
export const originSchema = z.enum(["entered", "catalog", "standard", "default"]);
export const quantitySchema = z.object({
  v: z.number().finite(),
  u: z.enum(UNITS),
  origin: originSchema.optional(),
});
export const paramValueSchema = z.union([quantitySchema, z.number(), z.string(), z.boolean()]);
export const paramsSchema = z.record(z.string(), paramValueSchema);
