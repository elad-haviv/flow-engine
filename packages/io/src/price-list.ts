import type { PriceItem, PriceList } from "@flow/views";
import { parseCsv } from "./csv";

export interface PriceListError {
  line: number;
  code: "missing_column" | "bad_price" | "empty_key" | "duplicate_key";
}
const COLUMNS = ["key", "description", "unit", "price", "currency"] as const;

/** Reads a price list. Bad rows are reported and skipped; nothing is guessed. */
export function parsePriceList(name: string, text: string): { list: PriceList; errors: PriceListError[] } {
  const rows = parseCsv(text);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const idx = COLUMNS.map((c) => head.indexOf(c));
  const errors: PriceListError[] = [];
  if (idx.some((i) => i < 0)) return { list: { name, items: [] }, errors: [{ line: 1, code: "missing_column" }] };
  const items: PriceItem[] = [];
  const seen = new Set<string>();
  rows.slice(1).forEach((r, n) => {
    const line = n + 2;
    const [key, description, unit, price, currency] = idx.map((i) => (r[i] ?? "").trim()) as [
      string,
      string,
      string,
      string,
      string,
    ];
    const value = Number(price.replace(",", "."));
    if (!key) return void errors.push({ line, code: "empty_key" });
    if (seen.has(key)) return void errors.push({ line, code: "duplicate_key" });
    if (price === "" || !Number.isFinite(value) || value < 0) return void errors.push({ line, code: "bad_price" });
    seen.add(key);
    items.push({ key, description, unit, price: value, currency });
  });
  return { list: { name, items }, errors };
}
