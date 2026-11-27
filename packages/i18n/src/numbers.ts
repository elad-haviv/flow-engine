import type { Locale } from "./format";

const LRM = "‎";
/** Numbers and units always read left to right, even inside Hebrew text. */
export function formatNumber(locale: Locale, n: number, digits = 3): string {
  return LRM + new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n) + LRM;
}
export function formatQuantity(locale: Locale, n: number, unit: string, digits = 3): string {
  return `${LRM}${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n)} ${unit}${LRM}`;
}
