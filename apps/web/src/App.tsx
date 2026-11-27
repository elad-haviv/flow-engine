import { direction, type Locale } from "@flow/i18n";
import { useEffect, useState } from "react";
import { BenchPage } from "./dev/BenchPage";
import { StoragePage } from "./dev/StoragePage";
import { Workbench } from "./Workbench";

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
  const dev = new URLSearchParams(location.search).get("dev");
  if (dev === "storage") return <StoragePage locale={locale} />;
  if (dev === "bench") return <BenchPage />;
  return <Workbench locale={locale} setLocale={setLocale} />;
}
