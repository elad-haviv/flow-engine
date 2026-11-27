# Phase 0 spec: foundations

* **Author:** Elad Haviv (owner), drafted with Claude Code
* **Status:** Draft for owner review. Work on Phase 0 starts when the owner approves this spec.
* **Date:** 2026-11-27
* **Design:** [flow-engine.md](../designs/flow-engine.md). Where this spec and the design's older Phase 0 file list differ, this spec rules.

## Purpose

Phase 0 creates the rules and the base everything else stands on: a repository that fails its own build when a rule is broken, a project model with a saved-file format, a message-catalog skeleton, storage interfaces, and a browser app shell that is deployed to the owner's Coolify after every push. No calculation and no editor exist yet.

## Scope

**In:** repository tooling and rules; CI; the `model` package (schema, IDs, units, diagnostics, commands, journal, document format, migrations, validation); the `i18n` skeleton; the `platform` package (types only); the `catalog` package skeleton holding only the standards manifest; the storage adapters in `apps/web`; the web shell and its deployment.

**Out:** solvers and any calculation (Phase 1); the editor and renderer (Phase 2); documents (Phase 3).

## Blue Grid parity rows in scope

| Row | Feature | Decision | Note |
| --- | --- | --- | --- |
| ED-056 | Save to JSON file | REDESIGN | Save goes through the storage interface with File System Access and a download fallback. |
| ED-057 | Load from JSON file | REDESIGN | Open needs validation and ordered migrations that never delete unknown data. |
| ED-059 | Autosave | REDESIGN | Autosave to IndexedDB behind the storage interface; users must be told it is not a backup. |
| CH-010 | Stable wire IDs and migration pass | REDESIGN | Stable IDs and versioned migration are core model rules tested from Phase 0. |
| CH-029 | Project JSON save/load with author and modified-by metadata | REDESIGN | Save and load round trip is a Phase 0 exit gate; author metadata waits for identity. |
| CH-030 | Local autosave to browser storage | REDESIGN | Autosave behind the storage interface; same as ED-059. |
| CH-037 | Hebrew RTL UI | KEEP | Hebrew RTL is a structural requirement from the i18n skeleton, so logical directions are used from the start. |
| CH-041 | Splash/loading screen | KEEP | A plain loading state is needed in the shell; no branding or organisation logo. |
| CH-106 | Automated test suite and Playwright e2e | REDESIGN | Tests and CI rules are a Phase 0 requirement; Playwright e2e grows with the editor in Phase 2. |

Rows for later phases are listed in [parity-checklist.md](../designs/parity-checklist.md).

## Decisions fixed by this spec

Origin: **Owner** means decided by the owner in this project. **Claude's proposal** means chosen here so the implementer does not have to; the owner can change any of them before work starts.

| Decision | Value | Origin |
| --- | --- | --- |
| Package manager and layout | pnpm workspaces; packages in `packages/*`, apps in `apps/*` | Claude's proposal |
| Node | The current LTS major when Phase 0 starts, pinned in `.nvmrc` and `engines` | Claude's proposal |
| Language | TypeScript, strict, ES modules, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, test folders type-checked | Owner (strict) / Claude's proposal (flags) |
| Build | Libraries compile with `tsc -b` project references. `apps/web` builds with Vite | Claude's proposal |
| Tests | Vitest, fast-check for property tests, Playwright from Phase 2 | Claude's proposal |
| Validation | zod schemas in `model` | Claude's proposal |
| IDs | 26-character ULID strings made by `newId()` in `model`, with the clock and the random source injected so tests are deterministic. Never reused. Branded types per entity (`DeviceId`, `WireId`, ...) | Claude's proposal |
| Units | Stored values are SI numbers with a unit tag: `{ "v": 400, "u": "V" }`. Units: V, A, Ω, W, VA, var, Hz, m, mm², °C, s. No conversion on save or load, so a round trip is exact. Conversion happens only in `model/src/units.ts` | Claude's proposal |
| Saved project | One JSON document: current model plus a command journal. The model is the truth. | Owner (design review, 2026-11-27) |
| Diagram rendering | SVG first, canvas only after a measured limit | Owner (design review, 2026-11-27) |
| Message syntax | Plain catalogs: `{param}` placeholders and plural keys with the suffixes `_one`, `_two`, `_other`, chosen by `Intl.PluralRules`. No third-party library | Claude's proposal |
| Browser support | Current Chromium-based browsers get File System Access. Firefox and Safari use upload and download. Exact versions are listed in the Phase 0 exit report | Claude's proposal |
| Auto-deploy | See "Deployment" below | Open: owner chooses |

## The project model

### Entities

All fields are required unless marked optional. `id` is a ULID. A stored entity never refers to a derived net.

| Entity | Fields |
| --- | --- |
| Project | `id`, `name`, `locale` (`he` or `en`), `profile` (`{ id, edition }`), `schemaVersion` |
| Device | `id`, `kind` (catalog kind ID), `name`, `params` (object, checked against the kind's schema), `state` (optional: `closed`, `open`, `grounded` for switches) |
| Terminal | `id`, `deviceId`, `role` (`in`, `out`, `earth`, `bus`), `conductors` (allowed conductor roles) |
| Cable | `id`, `lengthM`, `installation` (profile method code), `catalogRef` (optional), `conductors` (ordered list) |
| Conductor | `role` (`L1`, `L2`, `L3`, `N`, `PE`, `L`, `DC+`, `DC-`), `sectionMm2`, `material` (`Cu` or `Al`), `insulation` (`PVC`, `XLPE`, `none`) |
| Wire | `id`, `cableId`, `from`, `to` (each `{ terminalId }` or `{ junctionId }`) |
| Junction | `id`, `name` (optional), `ratingA` (optional) |
| Circuit | `id`, `panelId` (optional), `way` (optional), `phase` (optional), `members` (list of device and cable IDs, a device may appear in several circuits), `overrides` |
| Panel | `id`, `name`, `enclosure` (optional) |
| Placement | `id`, `viewId`, `entityId`, `x`, `y`, `rotation`, `w` (optional), `h` (optional), `waypoints` (optional) |
| Annotation | `id`, `type` (`text`, `rect`, `ellipse`, `arrow`), `placement`, `style`, `text` (optional) |

**Where state lives.** The saved position of a switch is part of the model (`Device.state`), because a project's normal operating state matters. The positions changed during a simulation are runtime state in Phase 3 and are not saved. Lock-out flags, trips, blown fuses and simulation time are runtime state and are not saved. An accepted default value is stored on the entity that uses it, with `origin: "default"` on the field.

### Field origin

Every quantity field in `params` and `Conductor` carries an optional `origin`: `entered` (default), `catalog`, `standard` or `default`. The trace in Phase 1 reads it.

### Commands

A command is `{ id, type, v, at, by, payload }`. `v` is the command's version. `by` is set by the `platform` identity adapter, and is `"local"` until Phase 6. Applying a command to a model returns the next model and a record of the change, or a rejection with a diagnostic code. The inverse of a command is derived from that record.

Phase 0 commands:

| Type | Payload | Rejected with |
| --- | --- | --- |
| `project.create` | name, locale, profile | none |
| `project.rename` | name | `model.project.name_empty` |
| `device.add` | kind, name, params | `model.device.kind_unknown`, `model.device.param_invalid` |
| `device.remove` | deviceId (its wires are removed in the same command) | `model.device.not_found` |
| `device.setParam` | deviceId, field, value with unit and origin | `model.device.not_found`, `model.device.param_invalid` |
| `device.setState` | deviceId, state | `model.device.state_invalid` |
| `wire.add` | cable (with conductors), from, to | `model.wire.endpoint_missing`, `model.wire.conductor_mismatch` |
| `wire.remove` | wireId | `model.wire.not_found` |
| `cable.setConductor` | cableId, role, field, value | `model.cable.not_found`, `model.cable.conductor_invalid` |
| `junction.promote` | terminalId, name, ratingA | `model.junction.not_applicable` |
| `junction.demote` | junctionId | `model.junction.has_data` |
| `circuit.create` / `circuit.setMembers` / `circuit.remove` | per entity | `model.circuit.member_missing` |
| `placement.set` | placement | `model.placement.entity_missing` |
| `annotation.add` / `annotation.set` / `annotation.remove` | per entity | `model.annotation.not_found` |
| `batch` | list of commands applied atomically (all or none) | the first rejection |

`junction.promote` and `junction.demote` change how a connection point is stored and never change connectivity. A test proves it. A busbar accepted from the advice rule is `batch` of `device.add`, `wire.remove` and `wire.add` commands.

### The saved file

```text
{
  "format": "flow-project",
  "schemaVersion": 1,
  "project": { ...Project, "devices": [...], "cables": [...], "wires": [...],
               "junctions": [...], "circuits": [...], "panels": [...],
               "placements": [...], "annotations": [...] },
  "journal": [ ...commands, oldest first... ],
  "extra": { ...unknown top-level or nested fields kept as found... }
}
```

* **Open.** Validate with zod, run the migration chain to the current `schemaVersion`, load `project`. The journal is read through upcasters and is not replayed.
* **Unknown data.** A field the schema does not know is kept under `extra` and reported as `model.file.unknown_field` (warning). Loading never deletes data. A field that breaks a rule is reported as an error with its path, and the file is refused only if the project cannot be built.
* **Migration.** `migrate(doc, fromVersion): doc` is one function per version step, stored in `model/src/document/migrations/`. `upcast(command): command` is one function per command type and version, stored in `model/src/journal/upcasters/`. Stored commands are never rewritten.
* **Retention.** The journal keeps the last 5,000 commands. Older commands are summarised only on the user's request.
* **Consistency.** After a migration, replaying the journal against the old model must give the new model. If it does not, the document wins and `model.file.journal_mismatch` (warning) is reported.
* **Atomic write.** The storage interface writes a temporary copy and replaces the file, so a crash cannot leave half a project.

### Diagnostics

A diagnostic is `{ code, severity, entities, params }`. `severity` is `error`, `warning` or `info`. Codes are lowercase dotted strings `area.entity.problem`, declared once in `model/src/diagnostics/codes.ts` as a constant object. The message for a code lives in the catalogs under the key `diag.<code>`. A test fails if any code lacks a Hebrew or an English message, or a message uses a parameter the diagnostic does not carry.

## Catalog skeleton: the standards manifest

`packages/catalog/src/standards/manifest.ts` lists, per profile, the standards and the edition used by version 1: `{ profile, standard, edition, clause set, dateTaken }`. The owner chose the latest edition available when Phase 0 starts, so each entry records the date it was taken. The tables themselves arrive in Phase 1. The test `manifest.test.ts` fails if an entry has no edition or date.

## Internationalisation skeleton

* `packages/i18n/src/catalogs/he.json` is the source. `en.json` mirrors it.
* Keys: `area.name`, lowercase, dot-separated.
* `format(locale, key, params)`: replaces `{param}` and picks the plural variant by `Intl.PluralRules(locale)`.
* `direction(locale)` returns `rtl` or `ltr`. `isolate(text)` wraps text in a Unicode first-strong isolate. Numbers and units are formatted by `formatNumber` and `formatQuantity` and always read left to right.
* Rule: no user-facing text outside the catalogs (enforced by the lint rule below).

## Platform interfaces (types only)

`packages/platform/src/index.ts` exports types and no code: `ProjectStorage` (`list`, `load`, `save`, `remove`, all asynchronous, with `revision` on save), `FileAccess` (`open`, `saveAs`), `Identity` (`current()`), `Licence` (`capabilities()`), and `Clock`. Adapters live in `apps/web` (Phase 0 for storage and file access) and in `packages/editions` (Phase 6).

## Web shell and storage adapters

* `apps/web`: a Vite and React shell. It shows the app name, the version and commit, and a language switch. It has no editor.
* `apps/web/src/storage/indexeddb.ts`: autosave behind `ProjectStorage`. The shell states that autosave is not a backup.
* `apps/web/src/storage/file-system-access.ts`: open and save through the File System Access API where available.
* `apps/web/src/storage/download-upload.ts`: the fallback for browsers without it.
* The shell has a developer-only page that saves and opens a sample project through each adapter, used by the browser tests.

## Repository rules

| Rule | Definition |
| --- | --- |
| Layer imports | `.dependency-cruiser.cjs` encodes the layer table of the design. A forbidden import fails `pnpm depcheck`. Negative fixtures in `tests/fixtures/forbidden-import/` prove that it fails. |
| File length | ESLint `max-lines` 300, skipping blank lines and comments, applied to source and tests alike |
| Complexity | ESLint `complexity` 12 |
| No `any` | `@typescript-eslint/no-explicit-any` as error |
| No DOM in lower layers | `no-restricted-globals` for `window`, `document`, `localStorage` in `model`, `catalog` and `engine`; `no-restricted-syntax` forbids `dispatchEvent` there |
| No hard-coded text | Custom rule `flow/no-hardcoded-text`: flags JSX text and the props `label`, `title`, `placeholder`, `alt`, `aria-label` set to a string literal, in `apps/**`, `packages/ui/**` and `packages/editor/**`. Allowed: strings that are only digits, symbols or a catalog key. |
| No kind comparison | Custom rule `flow/no-kind-comparison`: flags `===`, `!==` and `switch` on a `.kind` or `.type` member against a string literal, outside `packages/catalog` |
| Markers | `scripts/check-markers.mjs` fails on `TODO`, `FIXME`, `HACK`, `legacy` or `deprecated` unless `#<issue number>` follows on the same line. Files under `docs/` are exempt. |
| Duplicates | `jscpd` with a threshold of 3 percent |
| Unused code | `knip` |
| Coverage | `@vitest/coverage-v8`. Branch coverage at least 85 percent for `model` and `catalog`, set in each package's `vitest.config.ts`, enforced by `pnpm test --coverage` in CI |

The two custom rules live in `tools/eslint-plugin-flow/` with their own tests.

## Deployment

* `Dockerfile` at the repository root builds `apps/web` and serves the files with nginx on port 80. It replaces the placeholder shell.
* Coolify already has the application `flow-engine` (project "Flow Engine", domain `flow.haviv.pro`, built from the current development branch). Deployment does not start by itself on a push, because the repository is a public Git source without a webhook.
* **Open: how deploys start.** Options: (a) the owner adds a Coolify deploy webhook as a repository webhook, so every push deploys; (b) Claude triggers a deploy through the Coolify tool at the end of each work step; (c) a CI step calls the Coolify deploy API with a token stored as a repository secret. The owner chooses before Phase 0 ends. Until then, (b) is used.

## Files

### Repository root

`package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.npmrc` (exact versions), `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.editorconfig`, `.gitignore`, `.dockerignore`, `Dockerfile`, `.dependency-cruiser.cjs`, `vitest.workspace.ts`, `knip.json`, `.jscpd.json`, `scripts/check-markers.mjs`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `CLAUDE.md`, `README.md`.

`CLAUDE.md` is short. It states the layer map and import direction, the rules above, "edit the owning module and never add a second implementation", the spec-first rule, and where decisions are recorded. Target length: at most 80 lines.

### Documentation

`docs/adr/README.md` and `0001` to `0006` (layers, solver per power type, hybrid topology, journal and document, SVG first, in-house numeric core), `docs/specs/TEMPLATE.md`, `docs/verification/README.md`, `docs/verification/signoff.md`, and the existing `docs/designs/`, `docs/parity/`, `docs/reviews/`, `docs/research/`.

### `packages/model`

`src/index.ts`, `ids.ts`, `units.ts`, `schema/{project,device,terminal,cable,wire,junction,circuit,panel,placement,annotation}.ts`, `commands/{types,apply,inverse}.ts`, `journal/{journal,retention}.ts`, `journal/upcasters/{index,v1}.ts`, `document/{validate,load,save,invariants,extra}.ts`, `document/migrations/{index,v1}.ts`, `project/create.ts`, `diagnostics/{codes,diagnostic}.ts`.

Tests, with the assertions each must make:

| Test | Assertions |
| --- | --- |
| `ids.test.ts` | Ids are 26 characters, sort by time, never repeat across 100,000 calls, and are reproducible with the injected clock and random source |
| `units.test.ts` | Every unit converts to SI and back within 1e-12 relative. An unknown unit is rejected |
| `apply.test.ts` | One test per command: the expected model, the inverse restores the previous model exactly, each rejection code is returned for its bad input |
| `batch.test.ts` | A failing second command leaves the model unchanged |
| `junction.test.ts` | `promote` then `demote` leaves connectivity identical, and connectivity is identical before and after for any wire count from 1 to 5 |
| `undo.test.ts` | Undoing any sequence of random commands (fast-check, 200 runs) returns to the starting model |
| `journal.test.ts` | Appending, retention at 5,000, and that nothing is dropped without a request |
| `roundtrip.test.ts` | `save` then `load` returns a project deep-equal to the original, for random projects (fast-check, 200 runs) |
| `unknown-data.test.ts` | A file with unknown fields loads, keeps them under `extra`, and saves them back unchanged, with `model.file.unknown_field` reported |
| `migration.test.ts` | Each version fixture in `tests/fixtures/` opens to its expected model, and an unsupported future version is refused with a diagnostic |
| `consistency.test.ts` | A deliberately corrupted journal reports `model.file.journal_mismatch` and the document still wins |
| `diagnostics.test.ts` | Every code has a catalog message in both languages, and every message parameter exists on the diagnostic |

### `packages/i18n`, `packages/platform`, `packages/catalog`

`i18n/src/{index,format,direction,numbers,units}.ts`, `catalogs/{he,en}.json`, tests `keys.test.ts` (both catalogs have the same keys and parameters), `format.test.ts` (placeholders, Hebrew plural categories, missing keys fail), `direction.test.ts`, `numbers.test.ts`. `platform/src/index.ts` (types only). `catalog/src/{index.ts,standards/manifest.ts}` and `tests/manifest.test.ts`.

### `apps/web`

`index.html`, `vite.config.ts`, `src/{main,App}.tsx`, `src/storage/{indexeddb,file-system-access,download-upload}.ts`, `src/dev/StoragePage.tsx`, `tests/storage.test.ts` (with `fake-indexeddb`, and a browser test for the File System Access path).

### `tools/eslint-plugin-flow`

`src/index.ts`, `src/rules/{no-hardcoded-text,no-kind-comparison}.ts`, and a test file per rule with passing and failing code samples.

## Exit gates

Phase 0 is complete when all of these pass:

1. `pnpm typecheck`, `pnpm lint`, `pnpm depcheck`, `pnpm dupcheck`, `pnpm unused` and `pnpm test --coverage` pass in CI, with branch coverage at least 85 percent in `model` and `catalog`.
2. The negative fixtures fail as intended: a forbidden import, a file over 300 lines, an `any`, a marker without an issue number, a hard-coded string in `apps/web`, and a kind comparison outside `catalog` each fail the build.
3. `roundtrip.test.ts`, `undo.test.ts` and `migration.test.ts` pass.
4. The web shell is deployed to `flow.haviv.pro` and loads. The page shows the commit it was built from.
5. The storage adapters save and open the sample project in a Chromium browser and in a browser without File System Access.
6. The owner has answered the open items below, or has accepted the stated default.
7. The Phase 0 exit report lists the Node major, the browser versions tested, the measured journal size for a 1,000-device sample project, and the chosen deployment method.

## Open items for the owner

1. How deploys start (see Deployment). Default: Claude triggers them.
2. Approve or change the proposals in the decisions table, in particular SI units with a tag and ULID identifiers.
3. Whether a Hebrew-first default is also the default for the first-run language, or whether it follows the browser language. Default: follows the browser, falls back to Hebrew.
