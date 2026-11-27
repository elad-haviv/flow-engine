import type { Locale } from "./format";

export const direction = (l: Locale): "rtl" | "ltr" => (l === "he" ? "rtl" : "ltr");
/** Wrap text in a Unicode first-strong isolate so it cannot reorder neighbouring text. */
export const isolate = (text: string): string => `⁨${text}⁩`;
