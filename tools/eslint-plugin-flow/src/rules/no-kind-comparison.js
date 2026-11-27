const NAMES = new Set(["kind"]);
const isKindMember = (n) => n && n.type === "MemberExpression" && !n.computed && NAMES.has(n.property.name);
const isStr = (n) => n && n.type === "Literal" && typeof n.value === "string";

/** Behaviour belongs to the catalog entry; code outside the catalog must not branch on a device kind. */
export default {
  meta: {
    type: "problem",
    schema: [],
    messages: { kind: "Do not compare a device kind to a string. Put the behaviour in the catalog." },
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (!["===", "!==", "==", "!="].includes(node.operator)) return;
        if ((isKindMember(node.left) && isStr(node.right)) || (isKindMember(node.right) && isStr(node.left)))
          context.report({ node, messageId: "kind" });
      },
      SwitchStatement(node) {
        if (isKindMember(node.discriminant) && node.cases.some((c) => isStr(c.test)))
          context.report({ node, messageId: "kind" });
      },
    };
  },
};
