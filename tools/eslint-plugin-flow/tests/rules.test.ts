import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { describe, it } from "vitest";
import noHardcodedText from "../src/rules/no-hardcoded-text.js";
import noKindComparison from "../src/rules/no-kind-comparison.js";

RuleTester.describe = describe;
RuleTester.it = it;
const tester = new RuleTester({
  languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
});

tester.run("no-hardcoded-text", noHardcodedText, {
  valid: [
    "const a = <div>{t('app.name')}</div>;",
    "const a = <div>123 %</div>;",
    "const a = <input label='app.name' />;",
    "const a = <div className='x' />;",
  ],
  invalid: [
    { code: "const a = <div>Hello</div>;", errors: 1 },
    { code: "const a = <div>שלום</div>;", errors: 1 },
    { code: "const a = <input placeholder='Name' />;", errors: 1 },
    { code: "const a = <img alt='logo' />;", errors: 1 },
  ],
});
tester.run("no-kind-comparison", noKindComparison, {
  valid: [
    "if (a.kind === b.kind) {}",
    "if (a.size === 'big') {}",
    "if (c.type === 'project.create') {}",
    "const x = a.kind;",
  ],
  invalid: [
    { code: "if (d.kind === 'breaker') {}", errors: 1 },
    { code: "if ('grid' !== d.kind) {}", errors: 1 },
    { code: "switch (d.kind) { case 'load': break; }", errors: 1 },
  ],
});
