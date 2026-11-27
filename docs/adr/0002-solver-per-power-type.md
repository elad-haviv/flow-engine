# ADR 0002: Solver per power type

* **Status:** Accepted, 2026-11-27 (owner, design review)

## Context

AC three-phase, AC single-phase, DC and series loops behave differently.

## Decision

Each power type has its own solver. Converters couple islands through an iterated boundary with a cap and a diagnostic.

## Consequences

No single solver has to be generic. Mixed-type islands are errors unless a converter separates them.
