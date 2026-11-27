import {
  buildScene,
  createEditor,
  keyToAction,
  makeContext,
  problemsOf,
  reduce,
  terminalAtPoint,
  terminalMarkers,
  type Action,
  type EditorState,
  type Settings,
  type Problem,
} from "@flow/editor";
import { direction, t, type Locale } from "@flow/i18n";
import { loadDocument, saveDocument } from "@flow/model";
import type { Point } from "@flow/scene";
import { Banner, LayersPanel, Palette, ProblemsPanel, PropertiesPanel, SceneView, SettingsDialog } from "@flow/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fileAccess, indexedDbStorage } from "./storage";
import { useDocuments } from "./useDocuments";

const ctx = makeContext();
const storage = indexedDbStorage();
const LAST = "lastProject";
const SETTINGS = "settings";

function savedSettings(): Partial<Settings> {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS) ?? "{}") as Partial<Settings>;
  } catch {
    return {};
  }
}

const remember = (id: string): void => {
  try {
    localStorage.setItem(LAST, id);
  } catch {
    /* storage may be blocked */
  }
};
const recall = (): string | null => {
  try {
    return localStorage.getItem(LAST);
  } catch {
    return null;
  }
};

function selectable(state: EditorState, ids: string[]): string[] {
  const p = state.project;
  const out = new Set<string>();
  for (const id of ids) {
    if (p.devices.some((d) => d.id === id) || p.wires.some((w) => w.id === id)) out.add(id);
    const term = p.terminals.find((x) => x.id === id);
    if (term) out.add(term.deviceId);
    const wire = p.wires.find((w) => w.cableId === id);
    if (wire) out.add(wire.id);
  }
  return [...out];
}

export function Workbench({ locale, setLocale }: { locale: Locale; setLocale: (l: Locale) => void }) {
  const [state, setState] = useState<EditorState>(() => {
    const s = createEditor();
    return { ...s, settings: { ...s.settings, ...savedSettings() } };
  });
  const [guide, setGuide] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dispatch = useCallback((a: Action) => setState((s) => reduce(s, a, ctx)), []);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS, JSON.stringify(state.settings));
    } catch {
      /* storage may be blocked */
    }
  }, [state.settings]);

  useEffect(() => {
    const id = recall();
    if (!id) return;
    void storage.load(id).then((text) => {
      const r = text ? loadDocument(text) : undefined;
      if (r?.ok) setState({ ...createEditor(r.doc.project, state.profile), journal: r.doc.journal });
    });
  }, []);

  useEffect(() => {
    if (!state.project.devices.length && !state.undo.length) return;
    const timer = setTimeout(() => {
      void storage
        .save(
          state.project.id,
          state.project.name,
          saveDocument({ project: state.project, journal: state.journal, extra: [] }),
        )
        .catch(() => undefined);
      remember(state.project.id);
    }, 400);
    return () => clearTimeout(timer);
  }, [state.project, state.journal]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName);
      const action = keyToAction(e, typing, state.selection);
      if (!action) return;
      if (e.ctrlKey || e.metaKey) e.preventDefault();
      dispatch(action);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [dispatch, state.selection]);

  const scene = useMemo(
    () => buildScene(state.project, { results: state.results, expanded: state.expanded, hidden: state.hidden }),
    [state.project, state.results, state.expanded, state.hidden],
  );
  const documents = useDocuments(locale, state.project, state.results, scene, state.selection, state.profile);
  const problems = useMemo(() => problemsOf(state.results), [state.results]);
  const markers = useMemo(() => terminalMarkers(state.project), [state.project]);

  const onPlace = (p: Point) => {
    const tool = state.tool;
    if (tool.type === "place") dispatch({ type: "place", kind: tool.kind, x: p.x - 30, y: p.y - 30 });
    else if (tool.type === "annotate") dispatch({ type: "annotate", shape: tool.shape, x: p.x, y: p.y });
    else return;
    dispatch({ type: "tool", tool: { type: "select" } });
  };
  const onWireClick = (p: Point) => {
    const tid = terminalAtPoint(state.project, p);
    if (!tid || state.tool.type !== "wire") return;
    if (!state.tool.from) return dispatch({ type: "tool", tool: { type: "wire", from: tid } });
    dispatch({ type: "connect", from: state.tool.from, to: tid });
    dispatch({ type: "tool", tool: { type: "wire" } });
  };
  const onFix = (p: Problem) => p.fix && dispatch({ type: "fix", terminalId: p.fix.terminalId });

  const save = async () => {
    const text = saveDocument({ project: state.project, journal: state.journal, extra: [] });
    await fileAccess().saveAs(`${state.project.name || "project"}.flow.json`, text);
  };
  const open = async () => {
    const f = await fileAccess().open();
    const r = f ? loadDocument(f.text) : undefined;
    if (r?.ok) setState({ ...createEditor(r.doc.project, state.profile), journal: r.doc.journal });
  };

  const empty = state.project.devices.length === 0;
  return (
    <div className="app" dir={direction(locale)}>
      <header className="topbar">
        <h1>{t(locale, "app.name")}</h1>
        <button data-testid="undo" disabled={!state.undo.length} onClick={() => dispatch({ type: "undo" })}>
          {t(locale, "ui.undo")}
        </button>
        <button data-testid="redo" disabled={!state.redo.length} onClick={() => dispatch({ type: "redo" })}>
          {t(locale, "ui.redo")}
        </button>
        <button data-testid="save" onClick={() => void save()}>
          {t(locale, "ui.save")}
        </button>
        <button data-testid="open" onClick={() => void open()}>
          {t(locale, "ui.open")}
        </button>
        <button data-testid="docs-open" onClick={documents.open}>
          {t(locale, "doc.open")}
        </button>
        <button data-testid="settings-open" onClick={() => setSettingsOpen(true)}>
          {t(locale, "settings.open")}
        </button>
        <span className="spacer" />
        <label>
          {t(locale, "ui.profile")}
          <select
            data-testid="profile"
            value={state.profile}
            onChange={(e) => setState((s) => createEditorWith(s, e.target.value as "il" | "iec"))}
          >
            <option value="il">{t(locale, "ui.profile.il")}</option>
            <option value="iec">{t(locale, "ui.profile.iec")}</option>
          </select>
        </label>
        <label>
          {t(locale, "app.language")}
          <select data-testid="language" value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
            <option value="he">{t(locale, "lang.he")}</option>
            <option value="en">{t(locale, "lang.en")}</option>
          </select>
        </label>
        <small id="build" dir="ltr">
          {__VERSION__} · {__COMMIT__}
        </small>
      </header>
      <Banner locale={locale} tool={state.tool} />
      <Palette locale={locale} tool={state.tool} onTool={(tool) => dispatch({ type: "tool", tool })} />
      <main className="canvas">
        <SceneView
          scene={scene}
          selection={state.selection}
          markers={markers}
          tool={state.tool.type}
          showGrid={state.settings.showGrid}
          ariaLabel={t(locale, "ui.canvas")}
          onSelect={(ids) => dispatch({ type: "select", ids })}
          onPlace={onPlace}
          onWireClick={onWireClick}
          onMove={(ids, dx, dy) => dispatch({ type: "move", ids, dx, dy })}
        />
        {state.rejected && (
          <p className="rejected" role="alert">
            {t(locale, "ui.rejected", { code: state.rejected })}
          </p>
        )}
        {empty && guide && (
          <aside className="guide" data-testid="guide">
            <h2>{t(locale, "guide.title")}</h2>
            <ol>
              <li>{t(locale, "guide.1")}</li>
              <li>{t(locale, "guide.2")}</li>
              <li>{t(locale, "guide.3")}</li>
            </ol>
            <p className="muted">{t(locale, "guide.note")}</p>
            <button onClick={() => setGuide(false)}>{t(locale, "guide.dismiss")}</button>
          </aside>
        )}
      </main>
      {documents.dialog}
      {settingsOpen && (
        <SettingsDialog
          locale={locale}
          settings={state.settings}
          onChange={(patch) => dispatch({ type: "settings", patch })}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <aside className="side">
        <PropertiesPanel locale={locale} state={state} dispatch={dispatch} />
        <LayersPanel locale={locale} hidden={state.hidden} onToggle={(layer) => dispatch({ type: "layer", layer })} />
        <ProblemsPanel
          locale={locale}
          problems={problems}
          onSelect={(ids) => dispatch({ type: "select", ids: selectable(state, ids) })}
          onFix={onFix}
        />
      </aside>
    </div>
  );
}

function createEditorWith(s: EditorState, profile: "il" | "iec"): EditorState {
  return {
    ...createEditor(s.project, profile),
    journal: s.journal,
    undo: s.undo,
    redo: s.redo,
    selection: s.selection,
    tool: s.tool,
    expanded: s.expanded,
  };
}
