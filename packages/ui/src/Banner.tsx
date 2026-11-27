import { t, type Locale } from "@flow/i18n";
import type { Tool } from "@flow/editor";

/** Always visible: names the active tool and how to leave it. */
export function Banner({ locale, tool }: { locale: Locale; tool: Tool }) {
  const text =
    tool.type === "place"
      ? t(locale, "banner.place", { kind: t(locale, `kind.${tool.kind}`) })
      : tool.type === "wire"
        ? t(locale, tool.from ? "banner.wire.to" : "banner.wire.from")
        : t(locale, "banner.select");
  return (
    <div className="banner" role="status" data-tool={tool.type}>
      {text}
    </div>
  );
}
