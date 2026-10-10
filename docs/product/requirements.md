# Product Requirements Document & Scope Specification

Status: Derived from [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) (Draft for Owner Review)  
Last Updated: 2026-10-09  

---

## 1. Executive Summary & Problem Statement

### 1.1 Context & Problem
Customers of the single physical grocery store (*toko sembako*) need a straightforward way to select and order grocery items without needing to visit the store in person first. Simultaneously, store staff need a single authoritative record of online orders and real-time inventory availability to minimize manual coordination and stock-related order cancellations.

> [!NOTE]
> The current operational reliance on walk-in visits, WhatsApp messaging, phone calls, and manual stock records is a baseline assumption provided for planning. It must be formally validated with the store owner before implementation.

### 1.2 Proposed Solution
A responsive web application in Bahasa Indonesia serving one local grocery store:
* **Customer Facing**: Digital catalog, shopping cart, guest checkout, optional registered account checkout, in-store pickup fulfillment, bank transfer or pay-at-store payment options, and prefilled WhatsApp handoff for post-order communication.
* **Staff Facing**: Authenticated web dashboard for product catalog management, manual stock adjustments, payment verification, order preparation tracking, collection recording, and order cancellation.

### 1.3 Provisional Success Criteria (First 30 Days Post-Launch)
Subject to formal owner confirmation:
1. **Fulfillment Volume**: At least 10 online orders successfully reach the `collected` state.
2. **Order Integrity**: 100% of successfully placed online orders have a persisted database order ID and appear in the staff dashboard.
3. **No Lost/Duplicate Orders**: Zero online orders lost or duplicated due to manual handling or checkout retries.
4. **Stock Accuracy**: Fewer than 5% of submitted orders are cancelled due to incorrect stock availability (metric reported as both count and percentage; undefined if zero orders).
5. **Staff Self-Sufficiency**: Designated staff complete product management, stock adjustment, payment verification, preparation, collection, and cancellation without developer assistance in 100% of launch acceptance test scenarios.

---

## 2. User Personas

1. **Guest Customer (`Guest`)**:
   * Browses the catalog and places orders providing only their name and WhatsApp phone number.
   * Does not create an account or password.
   * Accesses order status and pickup instructions solely via a non-enumerable secret link.
2. **Registered Customer (`Registered`)**:
   * Creates an account or signs in to place orders and view their historical orders and order details.
   * Only has access to their own past and present orders.
3. **Store Owner & Designated Staff (`Staff`)**:
   * Operates the store dashboard with full administrative permissions over products, inventory, orders, payment status, and store settings.

---

## 3. Detailed User Stories & Acceptance Criteria

### Story 1: Browse and Select Products
* **Narrative**: As a customer, I want to browse products and choose quantities so that I can assemble an order before visiting the store.
* **Acceptance Criteria**:
  1. Active products display title, image (or standard fallback placeholder), category, selling unit (e.g., kg, pcs), price in IDR, and current availability status.
  2. Customers can search products by name and filter by category.
  3. Cart quantities must be positive whole integers of the declared selling unit. Fractional or custom-weight ordering is strictly excluded from MVP.
  4. Out-of-stock items (`available == 0`) cannot be added to the cart. Requests to add quantities exceeding available stock display an explicit validation error.
  5. The cart allows updating quantities, removing items, and inspecting item line totals and order subtotal.
  6. The server recalculates totals upon checkout submission. If prices or stock changed while the cart was open, the customer must review the changes before order placement can proceed.

### Story 2: Place an Order as Guest or Registered Customer
* **Narrative**: As a customer, I want to order with or without an account so that registration does not block my purchase.
* **Acceptance Criteria**:
  1. Guest checkout requires customer name and WhatsApp number; no user account is implicitly generated.
  2. Registered checkout supports sign-up, sign-in, sign-out, and scoped access to the customer's own orders.
  3. Fulfillment is strictly physical pickup at the store; delivery is not offered.
  4. Payment methods are strictly limited to Bank Transfer (`bank_transfer`) and In-Store Payment (`pay_at_store`).
  5. Placed orders snapshot product name, selling unit, price, ordered quantity, customer contact details, and chosen payment method.
  6. Checkout requires an `Idempotency-Key`. Re-submitting with the same key returns the existing order without creating secondary inventory reservations. Reusing a key with a mismatched payload is rejected (409 Conflict).
  7. Concurrency guarantee: When 1 unit remains in stock and two concurrent checkout requests arrive, exactly 1 order succeeds, 1 fails, and available inventory never drops below zero.
   8. Order confirmation is presented only after both the order row and inventory reservations have committed in the database transaction.
   9. Authenticated customers can claim past guest orders into their account by providing the secret guest access token via `POST /api/v1/customer/orders/claim`. Automatic linking by phone number alone is forbidden.

### Story 3: Receive Confirmation and Communicate via WhatsApp
* **Narrative**: As a customer, I want a saved order reference and payment/pickup instructions so that I can coordinate with the store.
* **Acceptance Criteria**:
  1. Confirmation screen displays human-readable order reference code, order items, total IDR, payment method, payment status, order state, pickup address, and operating hours.
  2. A prefilled `https://wa.me/` link is provided to contact store staff with preformatted order summary text. The link triggers no automated background messages.
  3. Reopening the order does not rely on WhatsApp message history. Guest orders can be reopened via a non-enumerable secret link containing a secure token.
  4. The secret access token is excluded from WhatsApp message text and web analytics. Public order references alone cannot retrieve customer personal information.
  5. Abandoning the WhatsApp link, failing to send a message, or reopening the page has no effect on order persistence.
  6. For bank transfer orders, store bank account details are displayed. Payment proof is transmitted by the customer directly over WhatsApp, not uploaded into the web application.
  7. Guest access tokens have a 30-day validity TTL (`guest_token_expires_at`). Recovery of lost tokens is mediated out-of-band by staff via WhatsApp.

### Story 4: Manage Catalog and Inventory
* **Narrative**: As staff, I want to maintain products and stock so that customers see what can actually be ordered.
* **Acceptance Criteria**:
  1. Authenticated staff can create, edit, deactivate, and assign categories/units/prices to products.
  2. Prices are stored and calculated strictly as integer Indonesian Rupiah (`IDR`). Floating-point currency values are forbidden.
  3. Stock tracking distinguishes On-Hand, Reserved, and Available quantities, where $\text{Available} = \text{On-Hand} - \text{Reserved}$.
  4. Manual stock adjustments record the acting staff member, timestamp, quantity change, and a mandatory reason note. Adjustments cannot reduce on-hand below reserved quantities.
  5. Offline walk-in sales are recorded via inventory adjustment entries; no external POS integration is provided.
  6. Deactivating a product prevents new orders but preserves past order snapshots and active order processing.

### Story 5: Process Payments, Preparation, and Pickup
* **Narrative**: As staff, I want to process saved orders so that I can prepare the correct goods and track completion.
* **Acceptance Criteria**:
  1. Staff dashboard lists all orders with filtering by order state, payment state, and reference code search.
  2. Order states: `submitted` $\rightarrow$ `accepted` $\rightarrow$ `preparing` $\rightarrow$ `ready_for_pickup` $\rightarrow$ `collected`, plus terminal `cancelled`.
  3. Payment states: `pending` and `confirmed`. Staff manually confirm bank transfers and store cash payments.
  4. Placing an order reserves stock for both payment methods immediately. Reservations do not expire automatically in MVP; staff manually review and cancel abandoned orders.
  5. Orders cannot be marked `collected` before payment is confirmed (`confirmed`).
  6. Marking an order `collected` atomically decreases both on-hand and reserved stock.
  7. Marking an order `cancelled` atomically releases reserved stock without decreasing on-hand stock.
  8. Repeated collection or cancellation requests do not alter inventory a second time. Collected orders cannot be cancelled via this workflow.
  9. Staff cancellations require a documented reason, including a dedicated category for inventory inaccuracies to track the launch success metric.
  10. Refunds for cancelled orders with confirmed payments must be executed and recorded manually by staff with structured audit fields (`refund_notes`, optional `refund_bank_ref` and `refund_date`); automated refunds are excluded.

---

## 4. Non-Goals (Explicitly Out of MVP Scope)

The following capabilities are strictly excluded from the initial release:
1. **Delivery Services**: No shipping fees, radius calculations, or courier integrations (e.g., Grab, Gojek).
2. **Multi-Store / Multi-Branch**: No marketplace models or multiple inventory warehouses.
3. **Automated Payment Gateways**: No automated bank feeds, credit card processing, virtual accounts, or QRIS dynamic generation.
4. **WhatsApp Business API**: No automated bots, outbound notifications, webhooks, or messaging API accounts.
5. **In-App Payment Proof Upload**: No image uploads or storage for bank transfer receipts.
6. **Automatic Reservation Expiration**: No scheduled TTL cron jobs releasing reserved stock in MVP.
7. **POS / Hardware Integration**: No barcode scanners, cash drawers, or external register sync.
8. **Fractional / Weight Ordering**: No custom weights (e.g., 0.75 kg) or post-order item substitutions.
