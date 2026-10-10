# Documentation Governance & Maintenance

Status: Active  
Last Updated: 2026-10-09  
Authoritative Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md)

---

## 1. Purpose & Scope

This document establishes the maintenance rules, change management processes, and authority hierarchy for the technical and product documentation of the Online Grocery Ordering project (`santo-groceries`).

The purpose of this documentation suite is to provide an unambiguous, shared contract between product management, engineering, and store operations. It documents approved functional specifications and technical directions while rigorously tracking unresolved design decisions.

---

## 2. Hierarchy of Authority

When discrepancies arise between documents, the following order of precedence applies:

1. **[`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md)**: The ultimate source of truth for approved business scope, core domain invariants, non-goals, and success metrics.
2. **Architecture Decision Records ([`docs/adr/`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/README.md))**: Authoritative records of accepted architectural decisions, technical boundaries, and system designs.
3. **Domain & Technical Specifications** (`docs/product/`, `docs/architecture/`, `docs/api/`, `docs/testing/`): Detailed implementations derived directly from the PRD and ADRs.
4. **Codebase Implementation**: Must strictly conform to the specifications and PRD. The existing codebase must never dictate requirements if it contradicts the PRD.

---

## 3. Core Domain Invariants (Non-Negotiable)

Any documentation edit or proposed system change must respect the core domain invariants defined in the PRD:

* **Inventory Equation**: $\text{Available Stock} = \text{On-Hand Stock} - \text{Reserved Stock}$. On-hand stock cannot be adjusted below reserved stock.
* **Atomic Checkout & Reservation**: Checkout atomically creates an order record and reserves stock within a single database transaction.
* **Idempotency**: Identical checkout retries using the same idempotency key return the existing order without duplicate reservations. Payload mismatches for an existing key are rejected.
* **Integer Currency**: Customer-facing prices, line items, and totals are stored and computed strictly as integer Rupiah (`IDR`). Floating-point arithmetic is forbidden.
* **Atomic Inventory Lifecycle Effects**:
  * *Collection* atomically decreases both on-hand and reserved quantities.
  * *Cancellation* atomically releases the reservation without altering on-hand inventory.
  * Repeated execution produces no secondary stock modifications (at-most-once inventory effect).
* **Order Transition Rules**:
  * An order cannot be collected before payment is confirmed (`confirmed`).
  * Collected orders cannot be cancelled via the standard cancellation workflow.
* **Guest Privacy**: Human-readable order references alone can never reveal personal information or order contents. Guest lookup strictly requires a high-entropy secret access token.
* **External Handoff Decoupling**: WhatsApp is strictly an optional external communication channel. Order persistence and dashboard tracking do not depend on WhatsApp delivery.

---

## 4. Documentation Change Management

### 4.1 Updating Existing Documents
* **PRD Updates**: Any changes to product scope, business rules, or success criteria must be updated in `docs/PRD.md` before or concurrently with dependent documents.
* **Cross-Document Consistency**: When a business rule or data field changes, all corresponding entries in `docs/product/business-rules.md`, `docs/architecture/data-model.md`, `docs/api/contracts.md`, and `docs/testing/test-cases.md` must be updated together.

### 4.2 Recording Architectural Decisions (ADRs)
* Significant architectural or structural changes (e.g., changes to storage layer, authentication mechanisms, hosting strategy, or transactional isolation) require a new ADR in `docs/adr/`.
* ADRs must follow the format detailed in [`docs/adr/0001-record-architecture-decisions.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/0001-record-architecture-decisions.md) and be linked from [`docs/adr/README.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/README.md).

### 4.3 Resolving Open Decisions
The PRD identifies several open decisions that must be resolved with the store owner before implementation or launch:
* Customer authentication and recovery mechanisms.
* Guest-link expiration and recovery policy.
* Manual refund handling for cancelled paid orders.
* Staff review cadence for pending pickup orders and abandoned reservations.
* Hosting, deployment, image storage, backup targets, and data retention policies.
* Final store profile details (address, pickup hours, bank transfer accounts).

**Resolution Workflow**:
1. Decisions are discussed and agreed upon with the store owner.
2. The resolution is recorded in an ADR or in the dedicated section of `docs/PRD.md`.
3. Open decision markers are removed from `docs/api/unresolved-questions.md` and related documents, replaced with concrete specifications.
