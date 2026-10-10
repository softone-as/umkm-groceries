# ADR 0002: Approved MVP Technology Stack

## Status
Accepted

## Date
2026-10-09

## Context
The project needs a robust, responsive web storefront and staff dashboard for a single neighborhood grocery store (*toko sembako*). Per PRD §4, the technology stack must prioritize strict type safety, predictable ACID inventory operations, fast build tooling, and zero-drift contract management while keeping operational complexity low.

## Decision
We adopt the PRD-approved technology stack:
1. **Frontend**: React with Vite, TanStack Router for type-safe routing, TanStack Query for server state caching and optimistic updates, and modern Vanilla CSS tokens.
2. **Backend**: Express.js with strict TypeScript and server-side schema validation.
3. **Database**: PostgreSQL as the authoritative relational database with row-level locking for inventory mutations.
4. **Topology**: Single-origin reverse proxy deployment serving both the client SPA and the `/api/v1` REST endpoints.
5. **Language & Locale**: Bahasa Indonesia for all customer and staff facing strings; integer Indonesian Rupiah (`IDR`) for currency.

All hosting providers, object storage providers, and customer authentication schemes remain open decisions (TBD) to be confirmed with the store owner.

## Consequences
* **Positive**:
  * Strict end-to-end type safety between API and client.
  * PostgreSQL transactions and constraints guarantee inventory integrity.
  * Same-origin topology simplifies cookie security (`HttpOnly`, `SameSite=Strict`, CSRF prevention).
  * Rapid client-side navigation and optimal bundle sizes via Vite.
* **Trade-off**:
  * Express requires explicit middleware configuration for validation, security headers, and route typing.
