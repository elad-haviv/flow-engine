const ATTRS = new Set(["label", "title", "placeholder", "alt", "aria-label"]);
const KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+)+$/;
const hasLetters = (s) => /\p{L}/u.test(s) && !KEY.test(s.trim());

/** User-facing text must come from the message catalogs. */
export default {
  meta: { type: "problem", schema: [], messages: { text: "Hard-coded user-facing text. Use a message catalog key." } },
  create(context) {
    return {
      JSXText(node) {
        if (hasLetters(node.value)) context.report({ node, messageId: "text" });
      },
      JSXAttribute(node) {
        const name = node.name && (node.name.name ?? "");
        if (!ATTRS.has(name)) return;
        const v = node.value;
        if (v && v.type === "Literal" && typeof v.value === "string" && hasLetters(v.value))
          context.report({ node, messageId: "text" });
      },
    };
  },
};
