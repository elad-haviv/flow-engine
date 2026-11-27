import { getComponent, type ParamSpec } from "@flow/catalog";
import type { Action, EditorState } from "@flow/editor";
import { t, type Locale } from "@flow/i18n";
import type { Device } from "@flow/model";
import { QuantityInput } from "./QuantityInput";

type Dispatch = (a: Action) => void;
const num = (v: unknown): number | undefined =>
  typeof v === "number" ? v : typeof v === "object" && v !== null && "v" in v ? (v as { v: number }).v : undefined;
const FAMILY_UNITS = new Set(["V", "A", "W", "VA", "var", "s"]);

function ParamField({
  locale,
  device,
  spec,
  dispatch,
  fallback,
}: {
  locale: Locale;
  device: Device;
  spec: ParamSpec;
  dispatch: Dispatch;
  fallback?: string;
}) {
  const raw = device.params[spec.name];
  const label = t(locale, `param.${spec.name}`);
  const id = `param-${spec.name}`;
  if (spec.unit === "text") {
    const value = typeof raw === "string" ? raw : typeof spec.default === "string" ? spec.default : (fallback ?? "");
    return (
      <label>
        {label}
        <select
          id={id}
          data-testid={id}
          value={value}
          onChange={(e) => dispatch({ type: "param", deviceId: device.id, field: spec.name, value: e.target.value })}
        >
          {value === "" && <option value="" />}
          {spec.options?.map((o) => (
            <option key={o} value={o}>
              {t(locale, `option.${o}`)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  const current = num(raw) ?? (typeof spec.default === "number" ? spec.default : undefined);
  const commit = (si: number) =>
    dispatch({
      type: "param",
      deviceId: device.id,
      field: spec.name,
      value: FAMILY_UNITS.has(spec.unit) ? { v: si, u: spec.unit as "V" } : si,
    });
  return (
    <label>
      {label}
      {spec.required ? " *" : ""}
      <QuantityInput id={id} family={spec.unit} si={current} onCommit={commit} />
    </label>
  );
}

function DeviceForm({
  locale,
  device,
  state,
  dispatch,
}: {
  locale: Locale;
  device: Device;
  state: EditorState;
  dispatch: Dispatch;
}) {
  const def = getComponent(device.kind);
  const load = state.results.loads.find((l) => l.deviceId === device.id);
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h3>{t(locale, `kind.${device.kind}`)}</h3>
      <label>
        {t(locale, "ui.name")}
        <input
          data-testid="name"
          value={device.name}
          onChange={(e) => dispatch({ type: "rename", deviceId: device.id, name: e.target.value })}
        />
      </label>
      {def?.states && (
        <label>
          {t(locale, "ui.state")}
          <select
            data-testid="state"
            value={device.state ?? def.states[0]}
            onChange={(e) => dispatch({ type: "state", deviceId: device.id, state: e.target.value as "open" })}
          >
            {def.states.map((s) => (
              <option key={s} value={s}>
                {t(locale, `state.${s}`)}
              </option>
            ))}
          </select>
        </label>
      )}
      {def?.params.map((spec) => (
        <ParamField
          key={`${device.id}:${spec.name}`}
          locale={locale}
          device={device}
          spec={spec}
          dispatch={dispatch}
          {...(spec.name === "system" && def.systems[0] ? { fallback: def.systems[0] } : {})}
        />
      ))}
      {load && (
        <dl className="result" data-testid="load-result">
          <dt>{t(locale, "ui.loadVoltage")}</dt>
          <dd dir="ltr">{`${Math.round(load.voltage.value * 10) / 10} V`}</dd>
          <dt>{t(locale, "ui.drop")}</dt>
          <dd dir="ltr">{`${Math.round(load.dropPercent.value * 100) / 100} %`}</dd>
        </dl>
      )}
      <button type="button" data-testid="delete" onClick={() => dispatch({ type: "delete", ids: [device.id] })}>
        {t(locale, "ui.delete")}
      </button>
    </form>
  );
}

function CableForm({
  locale,
  wireId,
  state,
  dispatch,
}: {
  locale: Locale;
  wireId: string;
  state: EditorState;
  dispatch: Dispatch;
}) {
  const wire = state.project.wires.find((w) => w.id === wireId)!;
  const cable = state.project.cables.find((c) => c.id === wire.cableId)!;
  const c = cable.conductors[0]!;
  const change = (
    patch: Parameters<typeof dispatch>[0] extends infer A
      ? A extends { type: "cable"; change: infer C }
        ? C
        : never
      : never,
  ) => dispatch({ type: "cable", cableId: cable.id, change: patch });
  const defaulted = cable.conductors.some((x) => x.origin === "default");
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h3>{t(locale, "cable.title")}</h3>
      {defaulted && <p className="hint">{t(locale, "cable.defaulted")}</p>}
      <label>
        {t(locale, "cable.length")}
        <QuantityInput id="cable-length" family="m" si={cable.lengthM} onCommit={(v) => change({ lengthM: v })} />
      </label>
      <label>
        {t(locale, "cable.section")}
        <QuantityInput id="cable-section" family="mm2" si={c.sectionMm2} onCommit={(v) => change({ sectionMm2: v })} />
      </label>
      <label>
        {t(locale, "cable.material")}
        <select
          data-testid="cable-material"
          value={c.material}
          onChange={(e) => change({ material: e.target.value as "Cu" })}
        >
          {["Cu", "Al"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t(locale, "cable.insulation")}
        <select
          data-testid="cable-insulation"
          value={c.insulation}
          onChange={(e) => change({ insulation: e.target.value as "PVC" })}
        >
          {["PVC", "XLPE"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t(locale, "cable.installation")}
        <input
          data-testid="cable-installation"
          dir="ltr"
          defaultValue={cable.installation}
          onBlur={(e) => e.target.value && change({ installation: e.target.value })}
        />
      </label>
      <button type="button" data-testid="expand" onClick={() => dispatch({ type: "expand", wireId })}>
        {state.expanded.includes(wireId) ? t(locale, "cable.collapse") : t(locale, "cable.expand")}
      </button>
      <button type="button" data-testid="delete" onClick={() => dispatch({ type: "delete", ids: [wireId] })}>
        {t(locale, "ui.delete")}
      </button>
    </form>
  );
}

function NoteForm({
  locale,
  id,
  state,
  dispatch,
}: {
  locale: Locale;
  id: string;
  state: EditorState;
  dispatch: Dispatch;
}) {
  const note = state.project.annotations.find((a) => a.id === id)!;
  const set = (patch: Partial<typeof note.placement>, text?: string) =>
    dispatch({
      type: "annotation",
      annotation: { ...note, placement: { ...note.placement, ...patch }, ...(text !== undefined ? { text } : {}) },
    });
  const sized = note.type === "rect" || note.type === "ellipse";
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h3>{t(locale, note.style["zone"] === "1" ? "annotate.zone" : `annotate.${note.type}`)}</h3>
      {note.type !== "arrow" && (
        <label>
          {t(locale, "note.text")}
          <input data-testid="note-text" value={note.text ?? ""} onChange={(e) => set({}, e.target.value)} />
        </label>
      )}
      {sized && (
        <>
          <label>
            {t(locale, "note.width")}
            <QuantityInput id="note-w" family="m" si={note.placement.w ?? 0} onCommit={(v) => v > 0 && set({ w: v })} />
          </label>
          <label>
            {t(locale, "note.height")}
            <QuantityInput id="note-h" family="m" si={note.placement.h ?? 0} onCommit={(v) => v > 0 && set({ h: v })} />
          </label>
        </>
      )}
      <button type="button" data-testid="delete" onClick={() => dispatch({ type: "delete", ids: [id] })}>
        {t(locale, "ui.delete")}
      </button>
    </form>
  );
}

export function PropertiesPanel({
  locale,
  state,
  dispatch,
}: {
  locale: Locale;
  state: EditorState;
  dispatch: Dispatch;
}) {
  const id = state.selection[0];
  const device = id ? state.project.devices.find((d) => d.id === id) : undefined;
  const wire = id ? state.project.wires.find((w) => w.id === id) : undefined;
  const note = id ? state.project.annotations.find((a) => a.id === id) : undefined;
  return (
    <section className="properties" aria-label={t(locale, "ui.properties")}>
      <h2>{t(locale, "ui.properties")}</h2>
      {device && <DeviceForm key={device.id} locale={locale} device={device} state={state} dispatch={dispatch} />}
      {wire && <CableForm key={wire.id} locale={locale} wireId={wire.id} state={state} dispatch={dispatch} />}
      {note && <NoteForm key={note.id} locale={locale} id={note.id} state={state} dispatch={dispatch} />}
      {!device && !wire && !note && <p className="muted">{t(locale, "ui.nothingSelected")}</p>}
    </section>
  );
}
