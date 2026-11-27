# ADR 0006: Own numeric core

* **Status:** Accepted, 2026-11-27 (owner, design review)

## Context

The solvers need complex numbers and dense LU only.

## Decision

Write them in-house, tested against known matrices.

## Consequences

No heavy dependency; sparse methods only if a measured case needs them.
