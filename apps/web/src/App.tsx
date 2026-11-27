import { direction, t, type Locale } from "@flow/i18n";
import { useEffect, useState } from "react";
import { StoragePage } from "./dev/StoragePage";

const initial = (): Locale => {
  try {
    const saved = localStorage.getItem("locale");
    if (saved === "he" || saved === "en") return saved;
  } catch {
    /* storage may be blocked */
  }
  return navigator.language.toLowerCase().startsWith("en") ? "en" : "he";
};

export function App() {
  const [locale, setLocale] = useState<Locale>(initial);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction(locale);
    try {
      localStorage.setItem("locale", locale);
    } catch {
      /* ignore */
    }
  }, [locale]);
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>{t(locale, "app.name")}</h1>
      <p id="build">
        {t(locale, "app.version", { version: __VERSION__ })} · <code>{__COMMIT__}</code>
      </p>
      <label>
        {t(locale, "app.language")}{" "}
        <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
          <option value="he">{t(locale, "lang.he")}</option>
          <option value="en">{t(locale, "lang.en")}</option>
        </select>
      </label>
      <p>{t(locale, "app.storageNote")}</p>
      <StoragePage locale={locale} />
    </main>
  );
}
