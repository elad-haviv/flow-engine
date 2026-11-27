/** Layer rules from the design. Each package may import only the layers listed here. */
const layers = {
  model: [],
  i18n: [],
  platform: [],
  catalog: ["model"],
  engine: ["model", "catalog"],
};
const all = Object.keys(layers);

module.exports = {
  forbidden: [
    ...all.map((name) => ({
      name: `layer-${name}`,
      severity: "error",
      comment: `packages/${name} may import only: ${layers[name].join(", ") || "nothing from other packages"}`,
      from: { path: `(^|/)packages/${name}/src/` },
      to: { path: `(^|/)(packages/(${all.filter((x) => x !== name && !layers[name].includes(x)).join("|")}|apps)/)` },
    })),
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.base.json" },
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(node_modules|dist|coverage)/" },
  },
};
