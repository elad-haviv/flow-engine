import { getComponent } from "@flow/catalog";
import { t, type Locale } from "@flow/i18n";
import type { BoqLine } from "@flow/views";
import { bestUnit } from "./quantity";

const trim = (n: number): string => String(Math.round(n * 100) / 100);

function attrText(kind: string, name: string, value: string | number): string {
  if (typeof value === "string") return value;
  const unit = getComponent(kind)?.params.find((p) => p.name === name)?.unit;
  if (!unit) return name === "sectionMm2" ? `${trim(value)} mm²` : trim(value);
  const d = bestUnit(value, unit);
  return `${trim(d.value)} ${d.unit}`;
}

/** Words for a bill-of-quantities line: what it is, then its attributes. */
export function describeLine(locale: Locale, line: BoqLine): string {
  const name = getComponent(line.what) ? t(locale, `kind.${line.what}`) : t(locale, `doc.what.${line.what}`);
  const attrs = Object.entries(line.attrs).map(([k, v]) => (k === "conductors" ? `×${v}` : attrText(line.what, k, v)));
  return [name, ...attrs].join(" ");
}
