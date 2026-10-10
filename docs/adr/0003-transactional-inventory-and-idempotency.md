# ADR 0003: Transactional Inventory & Idempotent Checkout

## Status
Accepted

## Date
2026-10-09

## Context
Online grocery stores face severe overselling risks during high-traffic moments or network dropouts when multiple customers attempt to purchase the final unit of stock simultaneously. Furthermore, flaky mobile connections lead customers to click "Submit" multiple times, risking duplicate orders and reservations.

PRD §2 and §4 require:
1. Available stock equals on-hand stock minus reserved stock.
2. Checkout creates an order and reserves inventory atomically.
3. Idempotent retries cannot duplicate orders or reservations.
4. Two concurrent checkouts for 1 unit must result in exactly 1 success and 0 negative availability.

## Decision
1. **Relational Inventory Balance**: We maintain explicit `on_hand` and `reserved` columns on the `inventory` table, backed by the database check constraint `CHECK (on_hand >= reserved)`.
2. **Pessimistic Row Locking**: Order placement executes within a PostgreSQL transaction using `SELECT ... FOR UPDATE` on all ordered items ordered deterministically by `product_id`. The reservation increments `reserved` atomically.
3. **Mandatory Idempotency Keys**: All order creation requests must include an `Idempotency-Key` header (UUID). The server stores the idempotency key alongside a SHA-256 hash of the order payload in the `orders` table (enforced by a database `UNIQUE` constraint).
4. **Retry Handling**: If an incoming request matches an existing key with identical payload hash, the server returns the existing order record without executing stock mutations. If the payload hash differs, the server rejects the request with `409 Conflict`.

## Consequences
* **Positive**:
  * Prevents negative inventory and race condition overselling mathematically at the database engine level.
  * Completely eliminates duplicate orders and double-reservations from client retries.
  * Guarantees all-or-nothing rollback if any single item fails availability checks.
* **Trade-off**:
  * Row-level locks introduce slight lock contention under intense concurrent demand for the same SKU, but well within the project's target capacity (10 concurrent users, 500 SKUs).
