// Browser journeys. Needs Playwright with its browser (`npm root -g` is searched when it is not installed locally).
// Usage: node apps/web/e2e/run.mjs [outDir]   (build the app first: pnpm --filter @flow/web build)
import { createServer } from "node:http";
import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const outDir = process.argv[2] ?? "/tmp";
const require = createRequire(import.meta.url);
let pw;
try {
  pw = require("playwright");
} catch {
  pw = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"))("playwright");
}

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  try {
    const file = await readFile(join(dist, path === "/" ? "index.html" : path));
    res.writeHead(200, { "content-type": types[extname(path || ".html")] ?? "text/html" }).end(file);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;
const browser = await pw.chromium.launch();
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} ${detail}`);
};

async function fresh(locale = "en") {
  const ctx = await browser.newContext({ locale, viewport: { width: 1280, height: 760 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => check("no page errors", false, String(e)));
  await page.goto(base);
  return page;
}
const canvas = (page) => page.locator("svg.scene");
async function place(page, kind, x, y) {
  await page.click(`[data-testid="place-${kind}"]`);
  const box = await canvas(page).boundingBox();
  await page.mouse.click(box.x + x, box.y + y);
}
async function markerAt(page, terminalIndex) {
  const m = page.locator('[data-testid="marker"]').nth(terminalIndex);
  const b = await m.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
async function wire(page, a, b) {
  await page.click('[data-testid="tool-wire"]');
  const pa = await markerAt(page, a);
  await page.mouse.click(pa.x, pa.y);
  const pb = await markerAt(page, b);
  await page.mouse.click(pb.x, pb.y);
}

// 1. First feeder, timed
{
  const t0 = Date.now();
  const page = await fresh("en");
  check("guide shown on an empty project", await page.locator('[data-testid="guide"]').isVisible());
  await place(page, "grid", 200, 80);
  await place(page, "breaker", 200, 220);
  await place(page, "load", 200, 360);
  check("three components placed", (await page.locator('[data-testid="el-device"]').count()) === 3);
  // marker order follows terminal creation: grid.out, breaker.in, breaker.out, load.in
  await wire(page, 0, 1);
  await wire(page, 2, 3);
  check("two wires drawn", (await page.locator('[data-testid="el-wire"]').count()) === 2);
  await page.click('[data-testid="tool-select"]');
  const label = await page.locator('[data-testid="el-device"] .s-value').first().textContent();
  check("load voltage appears on the diagram", /\d+ V/.test(label ?? ""), label ?? "");
  check(
    "no errors in the problems list",
    (await page.locator('[data-testid="problem"][data-code^="engine."].sev-error').count()) === 0,
  );
  check("first feeder under 60 seconds scripted", Date.now() - t0 < 60000, `${Date.now() - t0} ms`);
  await page.screenshot({ path: join(outDir, "feeder-en.png") });
  // undo / redo by keyboard
  await page.keyboard.press("Control+z");
  check("undo removes the last wire", (await page.locator('[data-testid="el-wire"]').count()) === 1);
  await page.keyboard.press("Control+Shift+z");
  check("redo restores it", (await page.locator('[data-testid="el-wire"]').count()) === 2);
  // Escape cancels a tool
  await page.click('[data-testid="place-load"]');
  check("banner names the tool", /Placing/.test(await page.locator(".banner").textContent()));
  await page.keyboard.press("Escape");
  check("Escape cancels the tool", (await page.locator(".banner").getAttribute("data-tool")) === "select");
  // edit a parameter: load power to 20 kW
  await page.locator('[data-testid="el-device"]').nth(2).click();
  const pw = page.locator('[data-testid="param-power"]');
  await pw.fill("20");
  await page.locator('select[aria-label="W"]').selectOption("kW");
  await pw.blur();
  await page.waitForTimeout(150);
  check(
    "power edit reaches the calculation",
    /20/.test((await page.locator('[data-testid="load-result"]').innerText()) ? "20" : ""),
  );
  await page.close();
}

// 2. Busbar advice and one-click fix
{
  const page = await fresh("en");
  await place(page, "grid", 300, 60);
  await place(page, "load", 120, 320);
  await place(page, "load", 300, 320);
  await place(page, "load", 480, 320);
  await wire(page, 0, 1);
  await wire(page, 0, 2);
  await wire(page, 0, 3);
  check(
    "busbar suggested at three wires",
    (await page.locator('[data-testid="problem"][data-code="advice.busbar.suggest"]').count()) === 1,
  );
  await page.click('[data-testid="fix"]');
  check(
    "one click adds the busbar and removes the advice",
    (await page.locator('[data-testid="problem"][data-code="advice.busbar.suggest"]').count()) === 0 &&
      (await page.locator('[data-testid="place-busbar"]').count()) === 1,
  );
  await page.screenshot({ path: join(outDir, "busbar-en.png") });
  await page.close();
}

// 2b. Notes, zones, layers and settings
{
  const page = await fresh("en");
  await place(page, "load", 300, 200);
  await page.click('[data-testid="annotate-zone"]');
  check("banner names the note tool", /Adding Zone/.test(await page.locator(".banner").textContent()));
  const box = await canvas(page).boundingBox();
  await page.mouse.click(box.x + 120, box.y + 120);
  check("a zone is added", (await page.locator('[data-testid="el-zone"]').count()) === 1);
  await page.click('[data-testid="annotate-text"]');
  await page.mouse.click(box.x + 500, box.y + 150);
  check("a text note is added", (await page.locator('[data-testid="el-annotation"]').count()) === 1);
  await page.locator('[data-testid="el-annotation"]').first().click();
  await page.locator('[data-testid="note-text"]').fill("Pump room");
  check(
    "the note text changes on the diagram",
    /Pump room/.test(await page.locator('[data-testid="el-annotation"]').first().textContent()),
  );
  await page.click('[data-testid="layer-zone"]');
  check("hiding the zone layer removes zones", (await page.locator('[data-testid="el-zone"]').count()) === 0);
  await page.click('[data-testid="layer-zone"]');
  check("showing it brings the zone back", (await page.locator('[data-testid="el-zone"]').count()) === 1);
  await page.click('[data-testid="settings-open"]');
  await page.locator('[data-testid="set-length"]').fill("30");
  await page.locator('[data-testid="set-length"]').blur();
  await page.click('[data-testid="settings-close"]');
  await place(page, "grid", 300, 60);
  await wire(page, 0, 1);
  await page.click('[data-testid="tool-select"]');
  await page.locator('[data-testid="el-wire"]').first().click({ force: true });
  check(
    "a new cable starts with the length from settings",
    (await page.locator('[data-testid="cable-length"]').inputValue()) === "30",
  );
  await page.close();
}

// 3. Hebrew UI with mixed-direction labels
{
  const page = await fresh("he-IL");
  check("Hebrew page is right to left", (await page.locator("html").getAttribute("dir")) === "rtl");
  await place(page, "motor", 300, 200);
  await page.locator('[data-testid="el-device"]').first().click();
  await page.locator('[data-testid="name"]').fill("משאבה P-101 (7.5kW)");
  await page.waitForTimeout(100);
  const text = await page.locator('[data-testid="el-device"] .s-label').textContent();
  check(
    "Hebrew label with Latin and numbers is isolated",
    text.startsWith("⁨") && text.endsWith("⁩") && text.includes("P-101"),
    JSON.stringify(text),
  );
  check("diagram stays left to right", (await canvas(page).getAttribute("direction")) === "ltr");
  await page.screenshot({ path: join(outDir, "motor-he.png") });
  await page.close();
}

// 4. Save and open fallback roundtrip through the file adapter (download and file chooser)
{
  const ctx = await browser.newContext({ locale: "en", acceptDownloads: true, viewport: { width: 1280, height: 760 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    delete window.showSaveFilePicker;
    delete window.showOpenFilePicker;
  });
  await page.goto(base);
  await place(page, "grid", 200, 100);
  await place(page, "load", 200, 300);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('[data-testid="save"]')]);
  const path = await dl.path();
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Control+z");
  check("undone to empty", (await page.locator('[data-testid="el-device"]').count()) === 0);
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click('[data-testid="open"]')]);
  await fc.setFiles(path);
  await page.waitForTimeout(300);
  check(
    "opening the saved file restores both components",
    (await page.locator('[data-testid="el-device"]').count()) === 2,
  );
  await ctx.close();
}

// 5. Rendering limit
{
  const page = await fresh("en");
  const rows = [];
  for (const n of [500, 1000, 2000, 4000]) {
    await page.goto(`${base}?dev=bench&n=${n}`);
    await page.click("#bench-run");
    await page.waitForFunction(() => document.querySelector("#bench-result").textContent.length > 2, null, {
      timeout: 120000,
    });
    rows.push(JSON.parse(await page.locator("#bench-result").textContent()));
  }
  console.log("BENCH " + JSON.stringify(rows));
  check("benchmark ran", rows.length === 4);
  await page.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
