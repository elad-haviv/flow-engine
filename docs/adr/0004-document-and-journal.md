# ADR 0004: Document and journal

* **Status:** Accepted, 2026-11-27 (owner, design review)

## Context

An event-sourced file would need every old command readable forever.

## Decision

The saved file holds the current model as the truth and a journal of the last 5,000 commands. Upcasters read old commands at read time; the document wins on any disagreement. Generated ids are recorded on the command so a replay reproduces the model.

## Consequences

Migrations act on the model. The journal is history, not the source of truth.
