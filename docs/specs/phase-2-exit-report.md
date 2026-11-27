# Phase 2 exit report

* **Date:** 2026-11-27
* **Status:** Slices A to D done and tested. Slice E (five first-time users) cannot be done by Claude. Phase 2 is not complete until people have tried it.

## Gates

| Gate | Result |
| --- | --- |
| 1. `pnpm verify` and the Playwright journeys pass | Pass: 185 unit tests; branch coverage enforced at 85 percent for model, catalog, engine, scene and editor; 26 of 26 browser checks (`pnpm e2e`, run by hand, see below) |
| 2. Hebrew label prototype shows mixed text correctly | Pass in headless Chromium: a Hebrew name with Latin letters and numbers is wrapped in a Unicode isolate and the diagram stays left to right. Screenshot checked by Claude. A native Hebrew reader should look at it too |
| 3. Rendering limit measured | See below |
| 4. Five people complete the first feeder in under ten minutes | **Open.** The scripted journey (place three components, two wires, read the voltage) takes about half a second; that says nothing about a person |

## Rendering limit

Headless Chromium on the build machine, software rendering, 60 steps of zoom per run, a chain of breakers (two SVG elements per device):

| Devices | SVG elements | Frame time with culling (mean) | Frame time without culling (mean / p95) |
| --- | --- | --- | --- |
| 500 | 990 | 16.7 ms | 16.7 / 21.8 ms |
| 1,000 | 1,980 | 16.7 ms | 26.0 / 43.1 ms |
| 2,000 | 3,960 | 17.2 ms | 48.0 / 74.7 ms |
| 4,000 | 7,920 | 16.7 ms | 106.1 / 148.3 ms |

16.7 ms is the display's frame time, so culling holds 60 frames per second at every size tested. Without culling the frame time passes 33 ms between 1,000 and 2,000 devices. The trigger for adding a canvas renderer is therefore: **culled frame time above 33 ms**, not yet reached at 4,000 devices. Real machines and phones will differ; the benchmark page is `?dev=bench&n=4000`.

## What exists

`scene` (primitives, bounds, hit testing, spatial grid, orthogonal wire routing), `symbols` (one drawing per catalog component, terminal anchors), `editor` (state, 15 actions, undo and redo, busbar fix, problems list, scene builder, keyboard shortcuts), `ui` (SVG view with pan, zoom and drag, palette, schema-driven property forms with unit selectors, cable form with conductor expansion, problems panel with one-click fix, mode banner), and the web app: language and standards switch, autosave and restore, save and open, first-run guide that never touches the project.

Model additions: `device.rename` and `cable.set` commands.

## Deviations and limits

* **Rotation is stored but not drawn**; symbols face one way.
* **Starter values.** A new device starts with ordinary values (for example a grid of 400 V and 5 MVA, a 50 A breaker clearing in 10 ms) so the first feeder calculates without errors. They appear in the form like any other value. A new cable starts at 10 m and 10 mm2 copper PVC and the cable form says "default cable values: check them".
* **`.type` is not checked by the lint rule** for kind comparisons (carried over from Phase 0); scene elements use `layer`.
* **Slice A to C are tested at the unit level and by the browser script**, not by a React component test suite.
* **Browser journeys are not part of `pnpm verify`.** `pnpm e2e` needs Playwright and its browser; it searches the global npm root if Playwright is not installed locally. Wiring it into CI needs `npx playwright install chromium` on the runner.
* **Zones, the layers pane, notes (text, rectangle, ellipse, arrow) and a settings page** are built (a zone is a dashed rectangle note with a name; layers can be hidden; settings hold the default length and cross-section of new cables and the grid toggle, kept in the browser). Note styling (colours, line widths, fonts) is not built.
* **No designer pass.** The symbols and the visual style are functional and clean but are Claude's, not a designer's.

## Open items for the owner

1. Who the five testers are and when.
2. Look at the Hebrew screens as a native reader; tell me what reads wrong.
3. Whether Phase 3 (documents) starts now or the test with people comes first.
