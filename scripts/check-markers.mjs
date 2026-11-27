import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SKIP = new Set(["node_modules", "dist", "coverage", ".git", "docs", "fixtures"]);
const EXT = /\.(ts|tsx|js|mjs|cjs|json|css|html)$/;
const MARK = /\b(TODO|FIXME|HACK|legacy|deprecated)\b/i;
const root = process.argv[2] ?? ".";
let bad = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!EXT.test(name) || name === "check-markers.mjs" || name === "pnpm-lock.yaml") continue;
    readFileSync(p, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (MARK.test(line) && !/#\d+/.test(line)) {
          console.error(`${p}:${i + 1}: marker without issue number`);
          bad++;
        }
      });
  }
}
walk(root);
process.exit(bad ? 1 : 0);
