# Online Grocery Ordering PRD

Status: Draft for owner review

## 1. Executive Summary

### Problem Statement

Customers need a way to select and order groceries without visiting the store first. The store needs a single record of online orders and accurate availability to reduce manual coordination and stock-related cancellations.

The current reliance on walk-ins, WhatsApp, phone calls, and manual stock records is an assumption supplied for planning, not a verified observation. Confirm it with the owner before implementation.

### Proposed Solution

Build a Bahasa Indonesia web application for one toko sembako, with a product catalog, cart, guest and registered checkout, and pickup at the physical store. Save orders in the application before offering a WhatsApp handoff; staff manage products, stock, payments, and order preparation through an authenticated dashboard.

### Success Criteria

Provisional targets for the first 30 days after launch, subject to owner approval:

- At least 10 online orders reach the collected state.
- 100% of successfully submitted online orders have a persisted order ID and appear in the dashboard.
- Zero online orders are lost or duplicated due to manual record handling or checkout retries.
- Fewer than 5% of submitted orders are cancelled for incorrect stock availability; report both the count and percentage, with the percentage undefined when there are no orders.
- Designated staff complete product editing, stock adjustment, payment verification, preparation, collection, and cancellation tasks without developer assistance in every launch acceptance scenario.

Measure order outcomes from stored status history and cancellation reasons. Record staff acceptance results before launch; review routine-operation support requests during the first month.

## 2. User Experience & Functionality

### User Personas

- Guest customer: orders groceries using a name and WhatsApp number without registering.
- Registered customer: signs in to access their own order history and details.
- Owner or designated staff: maintains the catalog and stock, verifies payments, prepares orders, and records pickup.

### User Flow

1. Customer browses available products, selects quantities, and opens the cart.
2. Customer continues as a guest or signs in/registers, supplies a name and WhatsApp number, and chooses bank transfer or payment at the store.
3. Server validates current prices and available stock, atomically creates the order and reserves stock, then returns an order reference and confirmation.
4. Confirmation shows the order total, store address, pickup hours, payment instructions, and a WhatsApp link. Opening WhatsApp is optional and does not create another order.
5. For bank transfer, the customer sends proof through WhatsApp and staff manually verify receipt against the bank account before marking payment confirmed.
6. Staff accept and prepare the order, then mark it ready for pickup. Pickup communication is manual through WhatsApp in the MVP.
7. Staff confirm payment and collection at the store. For cancellations, staff record a reason and release reserved stock.

### User Stories and Acceptance Criteria

#### Story 1: Browse and select products

As a customer, I want to browse products and choose quantities so that I can assemble an order before visiting the store.

- Each active product displays a name, image or explicit fallback, selling unit, IDR price, and availability.
- Customers can search by product name and filter by category.
- Cart quantities are positive whole numbers of the stated selling unit; fractional or custom-weight ordering is excluded from the MVP.
- Unavailable products cannot be added; quantities exceeding current availability show a validation error.
- Customers can change quantities, remove items, and see line totals and the order total.
- The server recalculates totals at checkout; changed prices or unavailable quantities require customer review before submission succeeds.

#### Story 2: Place an order as a guest or registered customer

As a customer, I want to order with or without an account so that registration does not block a purchase.

- Guest checkout requires a name and WhatsApp number; no account is created implicitly.
- Registered checkout supports registration, sign-in, sign-out, and access only to the signed-in customer's orders.
- Customer authentication and recovery mechanisms are an open design decision; do not assume paid SMS or WhatsApp authentication.
- Checkout offers exactly bank transfer and payment at the store, with pickup as the only fulfillment option.
- Order records snapshot product names, selling units, prices, quantities, customer contact details, and selected payment method.
- Checkout uses an idempotency key: retrying the same submission returns the same order without reserving stock again. Reusing the key with different order contents is rejected.
- With one unit available and two concurrent checkout requests, exactly one order succeeds and availability never becomes negative.
- Confirmation is displayed only after the order and reservation commit successfully. Failures preserve the cart and do not leave partial reservations.

#### Story 3: Receive confirmation and communicate through WhatsApp

As a customer, I want a saved order reference and payment/pickup instructions so that I can coordinate with the store.

- Confirmation includes order reference, items, total, payment method, payment state, order state, pickup address, and opening hours.
- A prefilled WhatsApp link to the store includes the order reference and summary; it performs no automated message sending.
- A customer can reopen order details without relying on WhatsApp delivery. Guest access uses a non-enumerable secret link, separate from the human-readable reference.
- Secret access tokens are not included in WhatsApp messages or analytics; human-readable order references alone cannot retrieve personal details.
- Closing WhatsApp, failing to send a message, or reopening the link does not remove or duplicate the saved order.
- Bank details are displayed for transfer orders. Proof is sent through WhatsApp, not uploaded or retained by the application.

#### Story 4: Manage catalog and inventory

As staff, I want to maintain products and stock so that customers see what can actually be ordered.

- Authorized staff can create and edit products, set their category, selling unit and price, manage images, and deactivate products.
- Prices use integer rupiah values. Order arithmetic does not use floating-point currency values.
- Stock distinguishes on-hand, reserved, and available quantities, where available equals on-hand minus reserved.
- Stock adjustments record actor, timestamp, quantity change, and reason. An adjustment cannot reduce on-hand below reserved stock.
- Staff record offline sales and other stock changes through inventory adjustments; a point-of-sale integration is not included.
- Deactivating a product prevents new orders without changing existing order snapshots.
- Routine catalog and stock changes require no code or deployment changes.

#### Story 5: Process payments, preparation, and pickup

As staff, I want to process saved orders so that I can prepare the correct goods and track completion.

- The dashboard lists all orders and supports filtering by order state and payment state, with order-reference search.
- Order states are submitted, accepted, preparing, ready for pickup, collected, and cancelled. Normal transitions follow that sequence; any uncollected order may be cancelled by staff.
- Payment states are pending and confirmed, independent of order state. Staff manually confirm transfer receipt or payment made at the store.
- Submission reserves stock for both payment methods. Reservations have no automatic expiry in the MVP; staff review pending orders and manually cancel abandoned orders.
- Transfer orders may be prepared before verification at staff discretion, but no order can be marked collected until payment is confirmed.
- Collection atomically decreases both on-hand and reserved quantities. Cancellation atomically releases the reservation without decreasing on-hand.
- Repeated collection or cancellation requests do not change stock a second time. Collected orders cannot be cancelled through this workflow.
- State changes and payment confirmations record actor and timestamp. Cancellation records a reason, including a distinct incorrect-stock reason for reporting.
- Customers request cancellation through WhatsApp; staff perform it in the dashboard. A confirmed payment requires a separately handled refund before cancellation is finalized, with staff recording the resolution. Automated refunds are excluded.

### Non-Goals

- Delivery, delivery fees, delivery tracking, or courier integrations.
- Multi-store operation, marketplace sellers, or separate branch inventory.
- Payment gateway integration, automatic transfer verification, QRIS, or card payments.
- WhatsApp Business API integration, automatic notifications, chatbots, or AI recommendations.
- In-app transfer-proof uploads, automatic reservation expiry, or self-service cancellation/refunds.
- Loyalty points, discounts, subscriptions, supplier purchasing, full accounting, or POS integration.
- Fractional/custom-weight products or substitution of unavailable items within an existing order.

## 3. AI System Requirements (If Applicable)

### Tool Requirements

Not applicable. No AI functionality or model API is required for the MVP.

### Evaluation Strategy

No AI output evaluation is needed. Functional, security, and concurrency testing are defined below.

## 4. Technical Specifications

### Architecture Overview

- Frontend: React with Vite, TanStack Router for routing, and TanStack Query for server state. Use strict TypeScript.
- Backend: Express.js with strict TypeScript, server-side input validation, and a REST API.
- Database: PostgreSQL as the source of truth for products, inventory, accounts, orders, order items, and audit history.
- Data flow: browser -> Express API -> PostgreSQL; WhatsApp opens as an external, customer-initiated link after order persistence.
- Inventory mutations use database transactions and row locks or equivalent conditional updates. Order creation, reservation, and idempotency enforcement commit together.
- Both guest and registered orders share one order-processing path. Public stock is informational; the transaction at checkout is authoritative.
- Deployment provider, product-image storage, database hosting, and backup provider are TBD. Prefer same-origin frontend/API routing to simplify session and browser security.

### Integration Points

- Public API: product/category retrieval, order submission, and token-authorized guest order lookup.
- Customer API: authentication and authorized order history/details; final authentication endpoints depend on the chosen account mechanism.
- Staff API: protected catalog, stock, order, payment, and store-settings operations.
- Store settings: shop name, address, pickup hours, WhatsApp number, and bank-transfer instructions, editable by authorized staff.
- WhatsApp: prefilled click-to-chat links only; no provider credentials, delivery webhooks, or messaging fees are required.
- Bank transfer: instructions and manual staff confirmation only; no bank API dependency.
- Order tracking: guest secret links and authenticated customer access; no publicly searchable order list.

### Security & Privacy

- Require authentication and authorization for every staff operation. Customers cannot access another customer's orders or modify stock, prices, or payment states.
- Use HTTPS in production. If session cookies are used, configure HttpOnly, Secure, SameSite, and CSRF protection for mutating requests.
- If password authentication is selected, use a vetted password-hashing library, secure recovery, and rate-limited login; never store plaintext passwords.
- Validate all request bodies server-side, parameterize database operations, limit checkout/authentication requests, and avoid logging personal data or guest access tokens.
- Guest tokens must have at least 128 bits of cryptographic randomness, be stored hashed, and be revocable. Token expiry and recovery policy must be agreed before launch.
- Collect only information needed for orders and accounts. Guest ordering does not require a delivery address, identity document, or email.
- Disclose that opening WhatsApp shares the prefilled order information with WhatsApp. Do not send data until the customer takes that action.
- Owner must approve privacy notice, order/contact retention periods, account deletion handling, and backup retention before launch. Review applicable Indonesian personal-data obligations; compliance is not assumed.
- Maintain recoverable database backups and demonstrate restoration before launch; frequency and recovery targets depend on hosting budget and remain TBD.

### Testing and Release Gates

- Integration tests cover price recalculation, validation, transactional reservation, duplicate submissions, concurrent last-unit purchases, rollback, collection, cancellation, and repeated staff actions.
- Authorization tests deny unauthenticated staff operations, cross-customer order access, and guest retrieval using only a human-readable order reference.
- End-to-end tests cover guest and registered checkout with both payment methods, WhatsApp link contents, stock updates, manual payment confirmation, preparation, and pickup.
- Verify an order remains visible to staff when the customer never opens WhatsApp.
- Verify invalid state transitions, collection before payment, inventory reductions below reservations, and unauthorized payment changes are rejected.
- Staff perform the routine-operation acceptance scenarios using test orders before launch.
- Proposed usability gate: catalog, cart, checkout, confirmation, and dashboard remain operable at 360px mobile and 1280px desktop widths, without horizontal overflow or overlapping controls; primary workflows support keyboard navigation and labeled inputs.
- Proposed performance gate: with 500 active products and 10 concurrent users, product-list and checkout API responses have p95 latency at or below 1 second, excluding image downloads and external WhatsApp. Confirm expected catalog size and hosting capacity before making this a committed SLA.
- Frontend and backend strict TypeScript checks and all release-blocking tests pass in CI.

## 5. Risks & Roadmap

### Phased Rollout

- MVP: confirm remaining launch decisions, implement single-store catalog, guest/registered ordering, transactional inventory, dashboard, manual payments, pickup, and WhatsApp handoff. Run staff acceptance tests, then pilot with a small customer group and monitor the provisional 30-day targets.
- v1.1, candidate scope only: improve pending-order review, reporting, and customer account recovery based on pilot evidence. Automatic reservation expiry requires an agreed payment/pickup policy and separate requirements.
- v2.0, candidate scope only: consider delivery or payment-provider integration only after owner approval and evidence of demand. Neither is a commitment in this PRD.

### Technical Risks

- Offline sales not recorded promptly cause incorrect online availability. Staff stock-adjustment discipline is required; reservations alone cannot reconcile physical inventory.
- Manual cancellation permits abandoned orders to hold stock indefinitely. Staff need an agreed daily review routine; no automatic release is promised.
- Transfer verification and paid-order cancellations create human error and refund obligations. Record verification and resolution; the application cannot independently confirm bank settlement.
- Concurrent requests or checkout retries can oversell or duplicate orders unless transactions and unique idempotency constraints are enforced.
- WhatsApp failure or a customer not sending the message must not affect order persistence; staff must use the dashboard as the source of truth.
- Guest access links can be forwarded or lost. Treat them as credentials and agree a recovery process without exposing order data through phone-number-only lookup.
- Image hosting, database outages, and backup costs depend on infrastructure choices. Failed writes must show an explicit error, not a success confirmation.

### Resolved Decisions Before Implementation (Per ADR 0006)

The following architectural and design decisions were resolved and recorded in [`docs/adr/0006-resolved-mvp-open-decisions.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/0006-resolved-mvp-open-decisions.md):
- **Customer Authentication**: Email & Password with standard email verification and password reset; rate limited. No SMS/WhatsApp verification costs.
- **Guest Order Claiming**: Authenticated customers can claim past guest orders into their account using their guest secret access token via `POST /api/v1/customer/orders/claim`. No unverified auto-linking by phone number.
- **Guest Link Expiry & Recovery**: 30-day token TTL; lost link recovery handled out-of-band via WhatsApp staff verification.
- **Refund Procedure**: Structured refund fields (`reason_category`, `refund_notes`, `refund_bank_ref`, `refund_date`) required when cancelling a paid order.
- **Product Image Storage**: Local disk storage served via Express static route (`/uploads/images`), wrapped in an `ImageStorageService` interface ready for Cloudflare R2 / AWS S3.
- **Codebase Organization**: Monorepo with npm/pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`).

### Operational Items for Launch
- Store details, initial catalog, and staff credentials initialized in seed migrations.
- Production hosting, backup schedule, and domain setup evaluated prior to live deployment.