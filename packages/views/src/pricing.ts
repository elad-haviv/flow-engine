import type { BoqLine } from "./boq";

export interface PriceItem {
  key: string;
  description: string;
  unit: string;
  price: number;
  currency: string;
}
export interface PriceList {
  name: string;
  items: PriceItem[];
}
export type PriceSource = { type: "list"; list: string } | { type: "manual" };

export interface PricedLine {
  line: BoqLine;
  unitPrice?: number;
  source?: PriceSource;
  total?: number;
}

export interface BoqTotals {
  pricedTotal: number;
  unpricedLines: number;
  discountPercent: number;
  afterDiscount: number;
  currencies: string[];
}

/** Prices a bill of quantities. A manual price beats a list; the first list that has the key wins. No guessing: a line with no price stays unpriced. */
export function priceBoq(
  lines: BoqLine[],
  lists: PriceList[],
  manual: Record<string, number>,
  discountPercent: number,
): { lines: PricedLine[]; totals: BoqTotals } {
  const currencies = new Set<string>();
  const priced = lines.map((line): PricedLine => {
    const m = manual[line.key];
    if (m !== undefined)
      return { line, unitPrice: m, source: { type: "manual" }, total: Math.round(m * line.quantity * 100) / 100 };
    for (const l of lists) {
      const item = l.items.find((i) => i.key === line.key);
      if (item) {
        currencies.add(item.currency);
        return {
          line,
          unitPrice: item.price,
          source: { type: "list", list: l.name },
          total: Math.round(item.price * line.quantity * 100) / 100,
        };
      }
    }
    return { line };
  });
  const pricedTotal = Math.round(priced.reduce((s, p) => s + (p.total ?? 0), 0) * 100) / 100;
  const afterDiscount = Math.round(pricedTotal * (1 - discountPercent / 100) * 100) / 100;
  return {
    lines: priced,
    totals: {
      pricedTotal,
      unpricedLines: priced.filter((p) => p.total === undefined).length,
      discountPercent,
      afterDiscount,
      currencies: [...currencies],
    },
  };
}
