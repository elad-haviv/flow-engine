# ADR 0001: Layers

* **Status:** Accepted, 2026-11-27 (owner, design review)

## Context

Blue Grid grew by patches on patches; behaviour leaked across the code.

## Decision

Packages model, catalog, engine, i18n, platform (and later views, scene, editor, ui) with allowed imports encoded in .dependency-cruiser.cjs. A forbidden import fails CI.

## Consequences

Lower layers have no DOM. New code has one obvious home. Cross-layer tests live in tests/cross.
