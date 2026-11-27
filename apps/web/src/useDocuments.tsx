import { t, type Locale } from "@flow/i18n";
import { boqCsv, parsePriceList, scheduleCsv, toDxf } from "@flow/io";
import type { Project } from "@flow/model";
import type { Results } from "@flow/engine";
import type { Scene } from "@flow/scene";
import { DocumentsDialog, describeLine } from "@flow/ui";
import {
  DEFAULT_BOQ,
  billOfQuantities,
  circuitSchedule,
  priceBoq,
  type BoqSettings,
  type PriceList,
} from "@flow/views";
import { useMemo, useState, type ReactNode } from "react";
import { downloadText } from "./storage";

/** State and dialog of the documents: circuit schedule, bill of quantities, price lists and exports. */
export function useDocuments(
  locale: Locale,
  project: Project,
  results: Results,
  scene: Scene,
): { open: () => void; dialog: ReactNode } {
  const [isOpen, setOpen] = useState(false);
  const [lists, setLists] = useState<PriceList[]>([]);
  const [manual, setManual] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [settings, setSettings] = useState<BoqSettings>(DEFAULT_BOQ);
  const [listNote, setListNote] = useState("");

  const docs = useMemo(() => {
    if (!isOpen) return undefined;
    return {
      schedule: circuitSchedule(project, results),
      boq: priceBoq(billOfQuantities(project, settings), lists, manual, discount),
    };
  }, [isOpen, project, results, settings, lists, manual, discount]);

  if (!isOpen || !docs) return { open: () => setOpen(true), dialog: null };

  const exportDoc = (what: "schedule" | "boq" | "dxf") => {
    const tr = (k: string) => t(locale, k);
    const name = project.name || "project";
    if (what === "schedule") downloadText(`${name}-schedule.csv`, scheduleCsv(docs.schedule, tr), "text/csv");
    else if (what === "boq")
      downloadText(
        `${name}-boq.csv`,
        boqCsv(docs.boq.lines, docs.boq.totals, (l) => describeLine(locale, l), tr),
        "text/csv",
      );
    else downloadText(`${name}.dxf`, toDxf(scene), "application/dxf");
  };
  const importList = (name: string, text: string) => {
    const r = parsePriceList(name, text);
    setLists((cur) => [...cur.filter((l) => l.name !== name), r.list]);
    setListNote(t(locale, "doc.boq.listLoaded", { name, count: r.list.items.length, errors: r.errors.length }));
  };
  return {
    open: () => setOpen(true),
    dialog: (
      <DocumentsDialog
        locale={locale}
        schedule={docs.schedule}
        boq={docs.boq}
        settings={settings}
        discount={discount}
        listNote={listNote}
        onSettings={(p) => setSettings((cur) => ({ ...cur, ...p }))}
        onDiscount={setDiscount}
        onManual={(key, price) => setManual((cur) => ({ ...cur, [key]: price }))}
        onImport={importList}
        onExport={exportDoc}
        onClose={() => setOpen(false)}
      />
    ),
  };
}
