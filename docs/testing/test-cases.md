# Requirement-Linked Test Cases & Traceability Matrix

Status: Authoritative Test Specifications  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §2, §4  
Last Updated: 2026-10-09  

---

## 1. Domain Invariant Test Cases

| Test Case ID | Target Invariant | Test Scenario & Preconditions | Input / Action | Expected Result | Pass/Fail Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`TC-INV-001`** | `INV-01`<br>Available Stock | Product has $\text{on\_hand} = 10$, $\text{reserved} = 3$. Staff attempts manual adjustment of $-8$. | `POST /api/v1/staff/inventory/adjust` with `change_qty = -8`. | Server rejects request with `422 Unprocessable Entity` (`INVALID_ADJUSTMENT`). | On-hand cannot drop below reserved ($10 - 8 = 2 < 3$). Inventory balances remain unchanged. |
| **`TC-INV-002`** | `INV-01`<br>Concurrency | Product has $\text{available} = 1$ ($\text{on\_hand} = 1, \text{reserved} = 0$). | Clients $A$ and $B$ send concurrent checkout requests for quantity $1$. | Exactly one request succeeds (`201 Created`); the other receives `422` (`INSUFFICIENT_STOCK`). | `on_hand = 1`, `reserved = 1`, `available = 0`. Availability is never negative. Exactly one order exists. |
| **`TC-INV-003`** | `INV-02`<br>Atomic Reservation | Product has $\text{available} = 2$. Client submits checkout for quantity $2$, but an injected failure occurs during item insertion. | `POST /api/v1/orders` triggering DB error. | Entire transaction rolls back; returns `500`. | `reserved` remains $0$. No dangling order or partial reservation exists. |
| **`TC-INV-004`** | `INV-03`<br>Idempotent Checkout | Client submits order with header `Idempotency-Key: KEY-123`. | Re-send identical request with `Idempotency-Key: KEY-123`. | Server returns `200/201` with original order details. | No new order created; inventory `reserved` count is incremented exactly once across both calls. |
| **`TC-INV-005`** | `INV-03`<br>Key Reuse Mismatch | Client submits order $O_1$ with `Idempotency-Key: KEY-123`. | Send different payload with same `Idempotency-Key: KEY-123`. | Server returns `409 Conflict` (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`). | Second order rejected; no inventory impact. |
| **`TC-INV-006`** | `INV-04`<br>Integer Currency | Cart with item $A$ (Rp 12.500 $\times$ 3) and item $B$ (Rp 8.000 $\times$ 1). | Submit order checkout. | Total calculated as integer $45500$. | All database columns (`price_idr_snapshot`, `total_amount_idr`) store exact integer values; zero float rounding. |
| **`TC-INV-007`** | `INV-05`<br>Atomic Collection | Order has status `ready_for_pickup`, `payment_state = confirmed`, item qty $2$. Product: $\text{on\_hand} = 10, \text{reserved} = 2$. | Staff calls `PATCH /api/v1/staff/orders/:id/state` with `state: "collected"`. | Order state updates to `collected`. Product balances update to $\text{on\_hand} = 8, \text{reserved} = 0$. | Both balances decremented by exactly 2. Re-submitting collected transition produces no additional stock deductions. |
| **`TC-INV-008`** | `INV-05`<br>Atomic Cancellation | Order has status `accepted`, item qty $2$. Product: $\text{on\_hand} = 10, \text{reserved} = 2$. | Staff calls `POST /api/v1/staff/orders/:id/cancel` with reason. | Order state updates to `cancelled`. Product balances update to $\text{on\_hand} = 10, \text{reserved} = 0$. | Reservation is released; on-hand physical stock is untouched. Re-submitting cancellation produces no change. |
| **`TC-INV-009`** | `INV-06`<br>Collection Irreversibility | Order is in `collected` state. | Staff attempts `POST /api/v1/staff/orders/:id/cancel`. | Request rejected with `422 Unprocessable Entity` (`CANNOT_CANCEL_COLLECTED_ORDER`). | Order remains `collected`; no inventory alteration. |
| **`TC-INV-010`** | `INV-07`<br>Payment Precedes Collection | Order is in `ready_for_pickup` with `payment_state = pending`. | Staff attempts `PATCH /api/v1/staff/orders/:id/state` with `state: "collected"`. | Request rejected with `422 Unprocessable Entity` (`PAYMENT_NOT_CONFIRMED`). | Order remains `ready_for_pickup`; collection is blocked. |
| **`TC-INV-011`** | `INV-08`<br>Guest Reference Isolation | Order exists with reference `ORD-202610-0042` and secret token `gsec_abc123`. | Anonymous user queries `/api/v1/orders/ORD-202610-0042` or search without token. | Request fails with `401 Unauthorized` or `404 Not Found`. | No customer names, phone numbers, or item lists disclosed. |
| **`TC-INV-012`** | `INV-09`<br>WhatsApp Decoupling | Customer completes checkout; browser is closed immediately without opening WhatsApp link. | Staff opens dashboard `/staff/orders`. | Order `ORD-202610-0042` appears in the list under `submitted`. | Order exists, inventory is reserved, and staff can process it regardless of external WhatsApp actions. |

---

## 2. User Story Acceptance Test Cases

### Story 1: Browse & Cart
* **`TC-STORY-1.1`**: Catalog displays active products with image/fallback, selling unit, price in IDR, and availability status.
* **`TC-STORY-1.2`**: Inactive products (`is_active = false`) are hidden from storefront catalog.
* **`TC-STORY-1.3`**: Adding quantity exceeding `available` returns immediate client validation error.
* **`TC-STORY-1.4`**: Attempting checkout when catalog price has changed returns `409 Conflict` requiring user review.

### Story 2: Checkout & Fulfillment
* **`TC-STORY-2.1`**: Guest checkout succeeds with valid name and Indonesian WhatsApp number; no user row created in `customer_accounts`.
* **`TC-STORY-2.2`**: Registered customer checkout correctly associates `customer_id` and appears in customer order history.
* **`TC-STORY-2.3`**: Only `bank_transfer` and `pay_at_store` payment options accepted.

### Story 3: Confirmation & Secret Link
* **`TC-STORY-3.1`**: Confirmation page renders prefilled WhatsApp link containing store number and plain-text order reference and summary.
* **`TC-STORY-3.2`**: WhatsApp URL parameter string does NOT contain the secret access token.
* **`TC-STORY-3.3`**: Loading `/orders/guest?token=valid_token` displays order status, store address, and pickup hours.

### Story 4: Staff Catalog & Inventory
* **`TC-STORY-4.1`**: Staff creates new product; appears immediately in storefront catalog.
* **`TC-STORY-4.2`**: Staff records inventory adjustment with reason; adjustment log entry created and inventory balance updated.
* **`TC-STORY-4.3`**: Unauthenticated request to staff product API rejected with `401 Unauthorized`.

### Story 5: Staff Order Processing & Cancellation
* **`TC-STORY-5.1`**: Staff filters dashboard orders by `order_state = submitted` and `payment_state = pending`.
* **`TC-STORY-5.2`**: Staff marks bank transfer payment as `confirmed`; updates payment state and enables collection.
* **`TC-STORY-5.3`**: Staff cancels order selecting reason category `incorrect_stock`; reservation releases and metrics reflect cancellation category.
