import { LAYERS, type Layer, type Shape, type Tool } from "@flow/editor";
import { t, type Locale } from "@flow/i18n";

const SHAPES: Shape[] = ["text", "rect", "ellipse", "arrow", "zone"];

export function AnnotationTools({ locale, tool, onTool }: { locale: Locale; tool: Tool; onTool: (t: Tool) => void }) {
  return (
    <section>
      <h3>{t(locale, "annotate.title")}</h3>
      {SHAPES.map((shape) => (
        <button
          key={shape}
          data-testid={`annotate-${shape}`}
          aria-pressed={tool.type === "annotate" && tool.shape === shape}
          onClick={() => onTool({ type: "annotate", shape })}
        >
          {t(locale, `annotate.${shape}`)}
        </button>
      ))}
    </section>
  );
}

export function LayersPanel({
  locale,
  hidden,
  onToggle,
}: {
  locale: Locale;
  hidden: Layer[];
  onToggle: (l: Layer) => void;
}) {
  return (
    <section className="layers" aria-label={t(locale, "layers.title")}>
      <h2>{t(locale, "layers.title")}</h2>
      {LAYERS.map((l) => (
        <label key={l} className="check">
          <input
            type="checkbox"
            data-testid={`layer-${l}`}
            checked={!hidden.includes(l)}
            onChange={() => onToggle(l)}
          />
          {t(locale, `layer.${l}`)}
        </label>
      ))}
    </section>
  );
}
