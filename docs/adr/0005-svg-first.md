# ADR 0005: SVG first

* **Status:** Accepted, 2026-11-27 (owner, design review)

## Context

The diagram must be accessible and easy to test.

## Decision

Draw with SVG, culling and a spatial index. Move to canvas only after a measured slowdown.

## Consequences

The drawing description (scene) stays the seam for DXF and PDF.
