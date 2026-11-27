import { DEFINITIONS } from "@flow/catalog";
import { SYMBOLS } from "./definitions";
import type { Symbol } from "./types";

export type { Symbol, Anchor } from "./types";
export { SYMBOLS };
export const symbolFor = (kind: string): Symbol | undefined => SYMBOLS[kind];
export const kindsWithoutSymbol = (): string[] => DEFINITIONS.map((d) => d.kind).filter((k) => !SYMBOLS[k]);
