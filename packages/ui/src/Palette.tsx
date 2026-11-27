import { DEFINITIONS } from "@flow/catalog";
import type { Tool } from "@flow/editor";
import { t, type Locale } from "@flow/i18n";
import { AnnotationTools } from "./AnnotationTools";

const GROUPS: Array<[string, string[]]> = [
  ["sources", ["grid", "generator", "battery", "solar_array"]],
  ["switching", ["breaker", "fuse", "contactor", "disconnector", "earthing_disconnector", "meter", "busbar"]],
  ["network", ["transformer"]],
  ["converters", ["rectifier", "inverter", "cc_regulator"]],
  ["loads", ["load", "motor", "capacitor", "series_load"]],
];

export function Palette({ locale, tool, onTool }: { locale: Locale; tool: Tool; onTool: (t: Tool) => void }) {
  return (
    <nav className="palette" aria-label={t(locale, "ui.palette")}>
      <h2>{t(locale, "ui.palette")}</h2>
      <div className="tools">
        <button
          data-testid="tool-select"
          aria-pressed={tool.type === "select"}
          onClick={() => onTool({ type: "select" })}
        >
          {t(locale, "ui.tool.select")}
        </button>
        <button data-testid="tool-wire" aria-pressed={tool.type === "wire"} onClick={() => onTool({ type: "wire" })}>
          {t(locale, "ui.tool.wire")}
        </button>
      </div>
      {GROUPS.map(([g, kinds]) => (
        <section key={g}>
          <h3>{t(locale, `group.${g}`)}</h3>
          {kinds
            .filter((k) => DEFINITIONS.some((d) => d.kind === k))
            .map((k) => (
              <button
                key={k}
                data-testid={`place-${k}`}
                aria-pressed={tool.type === "place" && tool.kind === k}
                onClick={() => onTool({ type: "place", kind: k })}
              >
                {t(locale, `kind.${k}`)}
              </button>
            ))}
        </section>
      ))}
      <AnnotationTools locale={locale} tool={tool} onTool={onTool} />
    </nav>
  );
}
