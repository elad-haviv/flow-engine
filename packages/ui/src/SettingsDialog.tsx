import type { Settings } from "@flow/editor";
import { t, type Locale } from "@flow/i18n";
import { QuantityInput } from "./QuantityInput";

export function SettingsDialog({
  locale,
  settings,
  onChange,
  onClose,
}: {
  locale: Locale;
  settings: Settings;
  onChange: (p: Partial<Settings>) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={t(locale, "settings.title")}
      data-testid="settings"
    >
      <div className="modal-body">
        <h2>{t(locale, "settings.title")}</h2>
        <p className="muted">{t(locale, "settings.note")}</p>
        <label>
          {t(locale, "settings.cableLength")}
          <QuantityInput
            id="set-length"
            family="m"
            si={settings.cableLengthM}
            onCommit={(v) => v >= 0 && onChange({ cableLengthM: v })}
          />
        </label>
        <label>
          {t(locale, "settings.cableSection")}
          <QuantityInput
            id="set-section"
            family="mm2"
            si={settings.cableSectionMm2}
            onCommit={(v) => v > 0 && onChange({ cableSectionMm2: v })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            data-testid="set-grid"
            checked={settings.showGrid}
            onChange={(e) => onChange({ showGrid: e.target.checked })}
          />
          {t(locale, "settings.showGrid")}
        </label>
        <button data-testid="settings-close" onClick={onClose}>
          {t(locale, "settings.close")}
        </button>
      </div>
    </div>
  );
}
