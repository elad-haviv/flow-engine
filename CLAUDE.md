# Flow Engine: working rules

Electrical single-line design and calculation app. Hebrew first, English second. Browser first.

## Layers (imports go downward only; enforced by `pnpm depcheck`)

model (no deps) · i18n · platform (types only) · catalog -> model · engine -> model, catalog · apps -> all

## Rules

- Edit the owning module. Never add a second implementation of the same thing.
- Spec first: behaviour comes from `docs/specs/`. If code and spec disagree, change the spec first, with the owner.
- No user-facing text outside `packages/i18n/src/catalogs`. Diagnostics carry a code; messages live in the catalogs as `diag.<code>`.
- No `if (x.kind === "...")` outside `packages/catalog`.
- No `any`, no file over 300 lines, no TODO/FIXME/legacy without `#issue`.
- Commands are the only write path to the model; every command has an inverse.
- Numbers engineers rely on need a trace and an owner sign-off (`docs/verification/`).

## Checks

`pnpm verify` runs typecheck, lint, markers, depcheck, dupcheck, unused and tests with coverage. Run it before every push.

## Where things are recorded

Decisions: `docs/adr/`. Design: `docs/designs/flow-engine.md`. Parity with Blue Grid: `docs/parity/`. Specs: `docs/specs/`.
