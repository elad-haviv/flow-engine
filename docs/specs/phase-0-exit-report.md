# Phase 0 exit report

* **Date:** 2026-11-27
* **Status:** Implementation complete; awaiting owner review of the open items.

## Exit gates

| Gate | Result |
| --- | --- |
| 1. typecheck, lint, depcheck, dupcheck, unused, tests with coverage (branch coverage at least 85 percent in model and catalog) | Pass locally (`pnpm verify`): 69 tests, branch coverage 87 percent. CI runs the same command (`.github/workflows/ci.yml`) |
| 2. Negative fixtures fail the build | Pass: `tests/negative.test.ts` covers forbidden import, file over 300 lines, `any`, DOM use in a lower layer, hard-coded text, kind comparison, marker without issue number |
| 3. round trip, undo, migration | Pass: `roundtrip` and `unknown-data` in `document.test.ts`, `undo.test.ts` (200 random runs), version-1 fixture and future-version refusal. A real migration step cannot be tested until schema version 2 exists |
| 4. Shell deployed to flow.haviv.pro showing its commit | See the deploy note in the hand-off message |
| 5. Storage adapters on Chromium and without File System Access | Pass in headless Chromium (Playwright script, run by hand, not in CI): File System Access path with stubbed pickers, and download/upload fallback with the pickers removed |
| 6. Open items answered or defaults accepted | Defaults used (below) |
| 7. Report data | Node 22; Chromium (Playwright build); measured document size for 1,000 devices plus a full 5,000-command journal: 1.1 MB (`tests/cross/journal-size.test.ts`); deploy method: Claude triggers it |

## Deviations from the spec, for the owner

* Terminals are stored in the project (a `terminals` collection) and created by `device.add` from the catalog kind via an injected context.
* A junction may carry a `terminalId`; wire ends that point at it resolve to that terminal. That is what makes promote and demote connectivity-neutral.
* Commands record the ids they generated (`ids`), so replaying a journal reproduces the model. Needed by the consistency check.
* Journal retention is enforced on append (oldest dropped past 5,000). The spec said older commands are summarised only on request; that summarising is not built.
* The `no-kind-comparison` rule flags only `.kind`, not `.type`, because `.type` is also used for commands and annotations.
* The diagnostics-message test lives in `tests/cross` so `model` does not import `i18n`.
* TypeScript is pinned to 6.x because typescript-eslint does not yet support 7.
* The standards manifest entries say "latest at entry"; actual editions are fixed with the Phase 1 tables.

## Open items (defaults used)

1. Deploys: Claude triggers them after each push. A repository webhook is the alternative.
2. SI units with a unit tag and ULID ids: implemented as proposed.
3. First-run language follows the browser, falls back to Hebrew.
