import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const run = (cmd: string, args: string[], input?: string) =>
  spawnSync(cmd, args, { cwd: process.cwd(), encoding: "utf8", ...(input !== undefined ? { input } : {}) }).status;
const lint = (file: string, code: string) => run("pnpm", ["exec", "eslint", "--stdin", "--stdin-filename", file], code);

describe("each rule fails the build when broken", () => {
  it("accepts clean code", () => {
    expect(lint("packages/model/src/ok.ts", "export const a = 1;\n")).toBe(0);
  });
  it("forbidden import between layers", () => {
    expect(run("pnpm", ["exec", "depcruise", "tests/fixtures/forbidden-import", "--config", ".dependency-cruiser.cjs"])).not.toBe(0);
  });
  it("file over 300 lines", () => {
    const code = Array.from({ length: 310 }, (_, i) => `export const v${i} = ${i};`).join("\n") + "\n";
    expect(lint("packages/model/src/big.ts", code)).not.toBe(0);
  });
  it("explicit any", () => {
    expect(lint("packages/model/src/any.ts", "export const a: any = 1;\n")).not.toBe(0);
  });
  it("DOM use in a lower layer", () => {
    expect(lint("packages/model/src/dom.ts", "export const a = window.innerWidth;\n")).not.toBe(0);
  });
  it("hard-coded text in apps", () => {
    expect(lint("apps/web/src/x.tsx", "export const A = () => <div>Hello</div>;\n")).not.toBe(0);
  });
  it("kind comparison outside the catalog", () => {
    expect(lint("packages/engine/src/k.ts", "export const f = (d: { kind: string }) => d.kind === 'breaker';\n")).not.toBe(0);
  });
  it("marker without an issue number", () => {
    const dir = mkdtempSync(join(tmpdir(), "markers-"));
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "src", "a.ts"), "// TODO fix later\n");
    expect(run("node", ["scripts/check-markers.mjs", dir])).not.toBe(0);
    writeFileSync(join(dir, "src", "a.ts"), "// TODO #12 fix later\n");
    expect(run("node", ["scripts/check-markers.mjs", dir])).toBe(0);
  });
});
