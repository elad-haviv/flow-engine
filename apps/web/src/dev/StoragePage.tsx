import { createProject, loadDocument, saveDocument } from "@flow/model";
import { t, type Locale } from "@flow/i18n";
import { useState } from "react";
import { fileAccess, fileAccessKind, indexedDbStorage } from "../storage";

/** Developer page: saves and opens a sample project through the file adapter. Used by the browser checks. */
export function StoragePage({ locale }: { locale: Locale }) {
  const [result, setResult] = useState("");
  const save = async () => {
    const p = createProject("Sample", locale, { id: "il", edition: "2026" });
    const text = saveDocument({ project: p, journal: [], extra: [] });
    await indexedDbStorage().save(p.id, p.name, text);
    await fileAccess().saveAs("sample.flow.json", text);
    setResult("saved");
  };
  const open = async () => {
    const f = await fileAccess().open();
    if (!f) return;
    const r = loadDocument(f.text);
    setResult(r.ok ? `opened:${r.doc.project.name}` : `error:${r.diagnostics[0]?.code ?? ""}`);
  };
  return (
    <section>
      <button id="dev-save" onClick={() => void save()}>
        {t(locale, "dev.save")}
      </button>
      <button id="dev-open" onClick={() => void open()}>
        {t(locale, "dev.open")}
      </button>
      <p>
        {t(locale, "dev.result")}:{" "}
        <output id="dev-result" data-adapter={fileAccessKind()}>
          {result}
        </output>
      </p>
    </section>
  );
}
