# ADR 0006: Resolution of MVP Open Decisions & Monorepo Structure

## Status
Accepted

## Date
2026-10-10

## Context
During the initial design phase (documented in [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) and [`docs/api/unresolved-questions.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/unresolved-questions.md)), several implementation details were preserved as open questions pending stakeholder review:
1. Customer account authentication and recovery mechanism without incurring SMS/WhatsApp OTP costs.
2. Guest secret token lifetime (TTL) and lost-link recovery protocol.
3. Product catalog image storage and upload mechanics.
4. Staff cancellation and manual refund audit requirements.
5. Mechanism for authenticated customers to claim historical guest orders.
6. Codebase repository organization for frontend, backend, and shared contracts.

Through the design review alignment, all open questions have now been resolved.

## Decision

### 1. Customer Authentication: Email & Password
* **Credentials**: Registered customer accounts use Email & Password.
* **Security**: Passwords hashed using bcrypt (cost factor 12) or Argon2id. No plaintext passwords stored.
* **Verification & Recovery**: Standard email-based verification tokens and password reset links (with 1-hour expiration and rate limiting). This incurs zero per-message SMS or WhatsApp API fees.
* **Session Management**: Secure, `HttpOnly`, `SameSite=Lax`, encrypted session cookies or signed tokens.

### 2. Guest Token Lifetime & Recovery
* **Token TTL**: Guest access tokens have a lifetime of **30 days** from order creation (`guest_token_expires_at`).
* **Recovery Protocol**: If a guest customer closes their browser and loses their tracking link, recovery is handled **out-of-band via WhatsApp** with store staff. Staff locate the order in the staff dashboard using the customer's name and human-readable order reference (`reference_code`), verify the customer's identity, and coordinate pickup or resend status. Unverified public phone lookup is forbidden.

### 3. Product Image Storage & Upload Architecture
* **MVP Implementation**: Local disk storage served via an Express static file route (`/uploads/images`).
* **Upload Mechanism**: `POST /api/v1/staff/products/:id/image` accepts `multipart/form-data` uploads (max 5MB, format converted/validated to WebP or JPEG).
* **Modular Storage Interface**: Storage logic is decoupled behind a TypeScript `ImageStorageService` interface (`saveImage`, `deleteImage`, `getImageUrl`) so that migrating to Cloudflare R2 or AWS S3 in production requires only configuring environment variables without altering controller or route code.

### 4. Cancellation & Refund Audit Trail
* **Structured Payload**: When staff cancel an order where payment was already confirmed (`payment_state === 'confirmed'`), the cancellation endpoint (`POST /api/v1/staff/orders/:id/cancel`) requires structured refund audit data:
  * `reason_category`: Enum (`incorrect_stock`, `customer_request`, `abandoned_unpaid`).
  * `refund_notes`: Mandatory text detailing how the refund was returned to the customer.
  * `refund_bank_ref`: Optional reference number from the store's bank transfer.
  * `refund_date`: Optional ISO date of the refund settlement.

### 5. Claiming Guest Orders into Registered Accounts
* **Token-Authorized Claim**: An authenticated customer can claim an order placed as a guest by submitting the guest secret access token via `POST /api/v1/customer/orders/claim`.
* **Security Rule**: The endpoint validates the guest token hash against the order. If valid and not already linked, `customer_id` is set to the authenticated customer's ID and `guest_token_hash` is cleared/invalidated. Automatic linking by phone number alone remains strictly forbidden.

### 6. Codebase Workspace Architecture
* **Monorepo Structure**: Standardized on npm/pnpm workspaces:
  * `apps/web/`: React + Vite + TanStack Router + TanStack Query + Vanilla CSS (Bahasa Indonesia storefront and staff dashboard).
  * `apps/api/`: Express.js + PostgreSQL + Strict TypeScript REST API.
  * `packages/shared/`: Shared TypeScript domain types, validation schemas (Zod), and API contracts.

## Consequences
* **Positive**:
  * Unblocks end-to-end implementation across database migrations, backend endpoints, and frontend pages.
  * Eliminates SMS/WhatsApp verification expenses while maintaining strict anti-enumeration privacy guarantees.
  * Standardizes monorepo tooling with shared type-safety between API and Web applications.
  * Ensures compliance with all core domain invariants specified in [`docs/governance.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/governance.md).
