import js from "@eslint/js";
import tseslint from "typescript-eslint";
import flow from "./tools/eslint-plugin-flow/src/index.js";

const lowerLayers = ["packages/model/**", "packages/catalog/**", "packages/engine/**"];

export default tseslint.config(
  {
    ignores: [
      ".dependency-cruiser.cjs",
      "**/dist/**",
      "**/dist-types/**",
      "**/coverage/**",
      "node_modules/**",
      "tests/fixtures/**",
      "**/fixtures/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { flow },
    rules: {
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      complexity: ["error", 12],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly", URL: "readonly", window: "readonly", document: "readonly" },
    },
  },
  {
    files: lowerLayers.map((g) => g + "/*.ts").concat(lowerLayers.map((g) => g + "/**/*.ts")),
    rules: {
      "no-restricted-globals": ["error", "window", "document", "localStorage", "sessionStorage", "navigator"],
      "no-restricted-syntax": [
        "error",
        { selector: "CallExpression[callee.property.name='dispatchEvent']", message: "No DOM events in lower layers." },
      ],
    },
  },
  {
    files: ["apps/**/*.{ts,tsx}", "packages/ui/**/*.{ts,tsx}", "packages/editor/**/*.{ts,tsx}"],
    rules: { "flow/no-hardcoded-text": "error" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["packages/catalog/**", "**/tests/**"],
    rules: { "flow/no-kind-comparison": "error" },
  },
);
