# ADR 0003: Hybrid topology

* **Status:** Accepted, 2026-11-27 (owner, design review)

## Context

Users connect many wires to one terminal; a stored net list can go out of step with wires.

## Decision

Nets are derived from terminals and wires. A junction record (optionally bound to a terminal) is stored only when it carries a name or rating.

## Consequences

Promote and demote never change connectivity; a test proves it.
