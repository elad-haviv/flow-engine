import type { Problem } from "@flow/editor";
import { t, type Locale } from "@flow/i18n";
import { messageOf } from "./messages";

export function ProblemsPanel({
  locale,
  problems,
  onSelect,
  onFix,
}: {
  locale: Locale;
  problems: Problem[];
  onSelect: (ids: string[]) => void;
  onFix: (p: Problem) => void;
}) {
  return (
    <section className="problems" aria-label={t(locale, "ui.problems")}>
      <h2>
        {t(locale, "ui.problems")}{" "}
        <span className="count" data-testid="problem-count">
          {problems.length}
        </span>
      </h2>
      {problems.length === 0 && <p className="muted">{t(locale, "ui.noProblems")}</p>}
      <ul>
        {problems.map((p) => (
          <li key={p.id} className={`sev-${p.diagnostic.severity}`} data-testid="problem" data-code={p.diagnostic.code}>
            <button className="link" onClick={() => onSelect(p.diagnostic.entities)}>
              <strong>{t(locale, `ui.severity.${p.diagnostic.severity}`)}</strong> {messageOf(locale, p.diagnostic)}
            </button>
            {p.fix && (
              <button data-testid="fix" onClick={() => onFix(p)}>
                {t(locale, "ui.fix.busbar")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
