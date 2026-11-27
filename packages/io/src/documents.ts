import type { BoqTotals, CircuitRow, PricedLine } from "@flow/views";
import { toCsv, type Cell } from "./csv";

type T = (key: string) => string;
const fixed = (n: number | undefined, d: number): Cell =>
  n === undefined ? undefined : Math.round(n * 10 ** d) / 10 ** d;

export function scheduleCsv(rows: CircuitRow[], t: T): string {
  const head = [
    "name",
    "kind",
    "protective",
    "ratedA",
    "cable",
    "lengthM",
    "powerW",
    "currentA",
    "voltageV",
    "dropPercent",
    "faultA",
    "cableOk",
  ].map((k) => t(`doc.col.${k}`));
  const body = rows.map((r): Cell[] => [
    r.name,
    t(`kind.${r.kind}`),
    r.protective?.name,
    r.protective?.ratedA,
    r.cable ? `${r.cable.material} ${r.cable.insulation} ${r.cable.sectionMm2}` : undefined,
    r.cable?.lengthM,
    fixed(r.powerW, 0),
    fixed(r.currentA, 1),
    fixed(r.voltageV, 1),
    fixed(r.dropPercent, 2),
    fixed(r.faultA, 0),
    r.cableOk === undefined ? undefined : t(r.cableOk ? "doc.ok" : "doc.fail"),
  ]);
  return toCsv([head, ...body]);
}

export function boqCsv(
  lines: PricedLine[],
  totals: BoqTotals,
  describe: (l: PricedLine["line"]) => string,
  t: T,
): string {
  const head = ["key", "description", "unit", "quantity", "unitPrice", "source", "total"].map((k) => t(`doc.col.${k}`));
  const body = lines.map((p): Cell[] => [
    p.line.key,
    describe(p.line),
    p.line.unit,
    p.line.quantity,
    p.unitPrice,
    p.source ? (p.source.type === "manual" ? t("doc.manual") : p.source.list) : t("doc.unpriced"),
    p.total,
  ]);
  const foot: Cell[][] = [
    [],
    [t("doc.total"), "", "", "", "", "", totals.pricedTotal],
    [t("doc.discount"), "", "", "", "", `${totals.discountPercent}%`, totals.afterDiscount],
    [t("doc.unpricedLines"), "", "", "", "", "", totals.unpricedLines],
  ];
  return toCsv([head, ...body, ...foot]);
}
