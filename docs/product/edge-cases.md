# Edge Cases & Failure Scenarios

Status: Authoritative Operational Specification  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §2, §4, §5  
Last Updated: 2026-10-09  

---

## 1. Concurrency & Inventory Race Conditions

### 1.1 Last Unit Contention (Two Concurrent Buyers)
* **Scenario**: Product $X$ has $\text{available} = 1$. Customer $A$ and Customer $B$ simultaneously submit checkout for 1 unit of $X$.
* **Expected Behavior**:
  * Both requests enter database transactions.
  * The first transaction to acquire the row lock on product $X$ checks availability ($\text{on\_hand} - \text{reserved} = 1 - 0 = 1 \ge 1$), increments `reserved` to 1, creates the order, and commits.
  * The second transaction waits for lock release, re-evaluates availability ($\text{on\_hand} - \text{reserved} = 1 - 1 = 0 < 1$), rolls back, and returns `422 Unprocessable Entity` with error code `INSUFFICIENT_STOCK`.
  * **Invariant Maintained**: Available stock never drops below 0; exactly one order succeeds.

### 1.2 Price Change While Cart is Open
* **Scenario**: Customer adds item at Rp 15.000. While the customer is filling the checkout form, staff updates the catalog price to Rp 18.000.
* **Expected Behavior**:
  * At checkout submission, the server re-queries current catalog prices.
  * The server detects the price mismatch, halts transaction before reservation, and returns `409 Conflict` with error code `PRICE_CHANGED` alongside the updated price.
  * Client presents an explicit review screen requiring customer confirmation of the new price. Cart is preserved.

### 1.3 In-Flight Product Deactivation
* **Scenario**: Staff deactivates a product (`is_active = false`) while customers have it in their carts.
* **Expected Behavior**:
  * Server-side checkout validation detects `is_active == false`.
  * Checkout fails with `422 Unprocessable Entity` (`PRODUCT_INACTIVE`).
  * If an order was already placed before deactivation, the historical order retains its snapshot and staff can fulfill it normally.

---

## 2. Idempotency & Network Retries

### 2.1 Identical Retry on Network Drop
* **Scenario**: Client sends `POST /api/v1/orders` with key `k1`. Server commits order and reserves stock, but connection drops before response reaches browser. Client retries with key `k1`.
* **Expected Behavior**:
  * Server checks `orders` table or idempotency store for `k1`.
  * Finds existing record, verifies identical payload checksum.
  * Immediately returns the original order confirmation and secret token with `200 OK` (or `201 Created`).
  * **Invariant Maintained**: No duplicate order record; no secondary stock deduction.

### 2.2 Reusing Idempotency Key with Mismatched Payload
* **Scenario**: Malfunctioning client or malicious actor submits a different order payload using an already-consumed key `k1`.
* **Expected Behavior**:
  * Server compares incoming payload checksum with stored checksum for `k1`.
  * Detects mismatch, rejects request immediately with `409 Conflict` (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`).

---

## 3. WhatsApp External Communication Scenarios

### 3.1 Customer Never Opens WhatsApp Link
* **Scenario**: Customer sees the confirmation screen, but closes the browser without clicking "Hubungi Toko via WhatsApp".
* **Expected Behavior**:
  * The order is already safely committed in PostgreSQL.
  * Order appears immediately in the staff dashboard under `submitted`.
  * Staff sees the customer's phone number on the dashboard and can contact them if needed.
  * **Invariant Maintained**: WhatsApp is never the source of truth for order existence.

### 3.2 Customer Forwards WhatsApp Order Summary to a Third Party
* **Scenario**: Customer forwards the prefilled text containing reference `ORD-202610-0042` to someone else.
* **Expected Behavior**:
  * The forwarded message contains only the public human-readable reference, item names, and store address.
  * It does NOT contain the secret guest access token or direct link.
  * The third party cannot use `ORD-202610-0042` on the web app to view customer phone numbers or order history.

---

## 4. Abandoned Orders & Stale Reservations

### 4.1 Customer Abandons Bank Transfer or Pickup
* **Scenario**: Customer chooses Bank Transfer but never transfers funds, or chooses Pay at Store but never shows up.
* **Expected Behavior**:
  * Stock remains reserved because automatic reservation expiry is excluded in MVP.
  * Staff reviews pending orders during daily review routine.
  * Staff contacts customer via WhatsApp. If unresponsive, staff clicks "Cancel Order" with reason `abandoned_unpaid` or `abandoned_uncollected`.
  * Reserved stock is immediately restored to available stock.

---

## 5. Offline Discrepancies & Stock Adjustments

### 5.1 Physical Stock Discrepancy (Breakage / Spoilage)
* **Scenario**: Store suffers spoilage of 5 bags of rice. The system has `on_hand = 10`, `reserved = 8`.
* **Expected Behavior**:
  * Staff attempts to reduce `on_hand` by 5 units.
  * The system evaluates constraint: $\text{new\_on\_hand} = 10 - 5 = 5$, but $\text{reserved} = 8$.
  * Adjustment is rejected: system cannot lower `on_hand` below `reserved`.
  * Staff must first review active orders, cancel any unfulfilled orders (e.g., reason `incorrect_stock`), which releases reservations before reducing physical stock.
