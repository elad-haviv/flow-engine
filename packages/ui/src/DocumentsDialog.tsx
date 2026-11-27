import { t, type Locale } from "@flow/i18n";
import type { BoqLine, BoqSettings, BoqTotals, CircuitRow, PricedLine } from "@flow/views";
import { useState } from "react";
import { describeLine } from "./describe";
import { QuantityInput } from "./QuantityInput";

export interface SwitchingView {
  isolate: Array<{ n: number; action: string; deviceId?: string }>;
  restore: Array<{ n: number; action: string; deviceId?: string }>;
  violations: Array<{ code: string; step?: number; deviceIds: string[] }>;
  nameOf: (id: string) => string;
  selected: number;
}

export interface DocumentsProps {
  locale: Locale;
  schedule: CircuitRow[];
  boq: { lines: PricedLine[]; totals: BoqTotals };
  settings: BoqSettings;
  discount: number;
  listNote: string;
  switching: SwitchingView;
  onSettings: (s: Partial<BoqSettings>) => void;
  onDiscount: (d: number) => void;
  onManual: (key: string, price: number) => void;
  onImport: (name: string, text: string) => void;
  onExport: (what: "schedule" | "boq" | "dxf" | "switching") => void;
  onClose: () => void;
}

const num = (n: number | undefined, d = 1): string =>
  n === undefined ? "" : String(Math.round(n * 10 ** d) / 10 ** d);

function ScheduleTable({ locale, rows }: { locale: Locale; rows: CircuitRow[] }) {
  const cols = [
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
  ];
  if (!rows.length) return <p className="muted">{t(locale, "doc.empty")}</p>;
  return (
    <table data-testid="schedule">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c}>{t(locale, `doc.col.${c}`)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.deviceId} data-testid="schedule-row">
            <td>{r.name}</td>
            <td>{t(locale, `kind.${r.kind}`)}</td>
            <td>{r.protective?.name}</td>
            <td dir="ltr">{r.protective?.ratedA}</td>
            <td dir="ltr">{r.cable ? `${r.cable.material} ${r.cable.insulation} ${r.cable.sectionMm2}` : ""}</td>
            <td dir="ltr">{r.cable?.lengthM}</td>
            <td dir="ltr">{num(r.powerW, 0)}</td>
            <td dir="ltr">{num(r.currentA)}</td>
            <td dir="ltr">{num(r.voltageV)}</td>
            <td dir="ltr">{num(r.dropPercent, 2)}</td>
            <td dir="ltr">{num(r.faultA, 0)}</td>
            <td>{r.cableOk === undefined ? "" : t(locale, r.cableOk ? "doc.ok" : "doc.fail")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function noteText(locale: Locale, line: BoqLine): string {
  const n = line.note;
  return n ? t(locale, "doc.boq.cableNote", { length: n.lengthM, slack: n.slackPerEndM, spare: n.sparePercent }) : "";
}

function BoqTable(p: DocumentsProps) {
  const { locale, boq } = p;
  if (!boq.lines.length) return <p className="muted">{t(locale, "doc.empty")}</p>;
  return (
    <table data-testid="boq">
      <thead>
        <tr>
          {["description", "unit", "quantity", "unitPrice", "source", "total"].map((c) => (
            <th key={c}>{t(locale, `doc.col.${c}`)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {boq.lines.map((l) => (
          <tr key={l.line.key} data-testid="boq-row" data-key={l.line.key}>
            <td>
              {describeLine(locale, l.line)}
              <small className="muted"> {noteText(locale, l.line)}</small>
            </td>
            <td>{l.line.unit}</td>
            <td dir="ltr">{l.line.quantity}</td>
            <td dir="ltr">
              {l.source?.type === "list" ? (
                l.unitPrice
              ) : (
                <input
                  aria-label={t(locale, "doc.boq.priceBy")}
                  data-testid="manual-price"
                  inputMode="decimal"
                  dir="ltr"
                  defaultValue={l.unitPrice ?? ""}
                  onBlur={(e) => {
                    const v = Number(e.target.value.replace(",", "."));
                    if (e.target.value !== "" && Number.isFinite(v) && v >= 0) p.onManual(l.line.key, v);
                  }}
                />
              )}
            </td>
            <td>
              {l.source
                ? l.source.type === "manual"
                  ? t(locale, "doc.manual")
                  : l.source.list
                : t(locale, "doc.unpriced")}
            </td>
            <td dir="ltr">{l.total ?? ""}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={5}>{t(locale, "doc.total")}</td>
          <td dir="ltr" data-testid="boq-total">
            {boq.totals.pricedTotal}
          </td>
        </tr>
        <tr>
          <td colSpan={5}>
            {t(locale, "doc.discount")} ({boq.totals.discountPercent}%)
          </td>
          <td dir="ltr">{boq.totals.afterDiscount}</td>
        </tr>
        <tr>
          <td colSpan={6} data-testid="boq-unpriced">
            {t(locale, "doc.boq.unpricedCount", { count: boq.totals.unpricedLines })}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function BoqControls(p: DocumentsProps) {
  const { locale } = p;
  return (
    <div className="boq-controls">
      <label>
        {t(locale, "doc.boq.import")}
        <input
          type="file"
          accept=".csv,text/csv"
          data-testid="price-file"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) p.onImport(f.name.replace(/\.[^.]+$/, ""), await f.text());
          }}
        />
      </label>
      <p className="muted">{t(locale, "doc.boq.importHelp")}</p>
      {p.listNote && <p data-testid="list-note">{p.listNote}</p>}
      <label>
        {t(locale, "doc.boq.discount")}
        <QuantityInput
          id="boq-discount"
          family="percent"
          si={p.discount}
          onCommit={(v) => v >= 0 && v <= 100 && p.onDiscount(v)}
        />
      </label>
      <label>
        {t(locale, "doc.boq.slack")}
        <QuantityInput
          id="boq-slack"
          family="m"
          si={p.settings.slackPerEndM}
          onCommit={(v) => v >= 0 && p.onSettings({ slackPerEndM: v })}
        />
      </label>
      <label>
        {t(locale, "doc.boq.spare")}
        <QuantityInput
          id="boq-spare"
          family="percent"
          si={p.settings.sparePercent}
          onCommit={(v) => v >= 0 && p.onSettings({ sparePercent: v })}
        />
      </label>
    </div>
  );
}

type Step = { n: number; action: string; deviceId?: string };
const stepText = (locale: Locale, view: SwitchingView, s: Step): string =>
  `${t(locale, `sw.action.${s.action}`)} ${s.deviceId ? view.nameOf(s.deviceId) : ""}`.trim();

function SwitchingTab({ locale, view }: { locale: Locale; view: SwitchingView }) {
  if (!view.selected)
    return (
      <p className="muted" data-testid="sw-hint">
        {t(locale, "sw.hint")}
      </p>
    );
  return (
    <div data-testid="switching">
      <h3>{t(locale, "sw.isolate")}</h3>
      <ol>
        {view.isolate.map((s) => (
          <li key={s.n} data-testid="sw-step">
            {stepText(locale, view, s)}
          </li>
        ))}
      </ol>
      <h3>{t(locale, "sw.restore")}</h3>
      <ol>
        {view.restore.map((s) => (
          <li key={s.n}>{stepText(locale, view, s)}</li>
        ))}
      </ol>
      <h3>{t(locale, "sw.violations")}</h3>
      {view.violations.length === 0 && <p data-testid="sw-ok">{t(locale, "sw.ok")}</p>}
      <ul>
        {view.violations.map((v, i) => (
          <li key={i} className="sev-error" data-testid="sw-violation" data-code={v.code}>
            {t(locale, `sw.violation.${v.code}`, { device: v.deviceIds.map(view.nameOf).join(", ") })}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocumentsDialog(p: DocumentsProps) {
  const [tab, setTab] = useState<"schedule" | "boq" | "switching">("schedule");
  const { locale } = p;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={t(locale, "doc.title")} data-testid="documents">
      <div className="modal-body wide">
        <h2>{t(locale, "doc.title")}</h2>
        <div className="tabs">
          <button data-testid="tab-schedule" aria-pressed={tab === "schedule"} onClick={() => setTab("schedule")}>
            {t(locale, "doc.tab.schedule")}
          </button>
          <button data-testid="tab-boq" aria-pressed={tab === "boq"} onClick={() => setTab("boq")}>
            {t(locale, "doc.tab.boq")}
          </button>
          <button data-testid="tab-switching" aria-pressed={tab === "switching"} onClick={() => setTab("switching")}>
            {t(locale, "doc.tab.switching")}
          </button>
          <span className="spacer" />
          <button data-testid="export-csv" onClick={() => p.onExport(tab)}>
            {t(locale, "doc.export.csv")}
          </button>
          <button data-testid="export-dxf" onClick={() => p.onExport("dxf")}>
            {t(locale, "doc.export.dxf")}
          </button>
        </div>
        <div className="doc-scroll">
          {tab === "schedule" && <ScheduleTable locale={locale} rows={p.schedule} />}
          {tab === "boq" && (
            <>
              <BoqControls {...p} />
              <BoqTable {...p} />
            </>
          )}
          {tab === "switching" && <SwitchingTab locale={locale} view={p.switching} />}
        </div>
        <button data-testid="documents-close" onClick={p.onClose}>
          {t(locale, "doc.close")}
        </button>
      </div>
    </div>
  );
}
