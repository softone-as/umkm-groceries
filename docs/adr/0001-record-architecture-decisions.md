# ADR 0001: Record Architecture Decisions

## Status
Accepted

## Date
2026-10-09

## Context
As the Online Grocery Ordering project transitions from PRD to design and implementation, engineering and product decisions will be made that affect system boundaries, data contracts, and operational requirements. Without documented rationale, architectural choices can be misunderstood, accidentally reverted, or lost.

## Decision
We will use lightweight Architecture Decision Records (ADRs) based on the standard Michael Nygard format. Each record will reside in `docs/adr/` as a numbered Markdown document and will be indexed in `docs/adr/README.md`.

## Consequences
* **Positive**: Architectural context is version-controlled and visible to all contributors; decisions are explicitly justified against PRD constraints.
* **Trade-off**: Requires discipline to author and review ADRs during significant architectural shifts.
