# TICKET-04: Shopping Cart, Order Placement Transaction, & Checkout Workflow

## 1. Ticket Information
* **Ticket ID**: `TICKET-04`
* **Title**: Shopping Cart, Order Placement Transaction, & Checkout Workflow
* **Phase**: 4 — Core Transactional Commerce Flow
* **Estimated Effort**: 4 Days
* **Dependencies**: `TICKET-01`, `TICKET-02`, `TICKET-03`
* **Governing Specifications**:
  * [`SPEC.md`](file:///Users/shofwanasy/projects/santo-groceries/SPEC.md) §1, §2, §3.1, §3.4, §4.1, §5.4
  * [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §2.2, §2.3, §4.1
  * [`docs/api/contracts.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/contracts.md) §1, §2.3
  * [`docs/architecture/data-model.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/data-model.md) §2.2, §2.4, §2.5, §2.6
  * [`docs/testing/test-cases.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/testing/test-cases.md) §2

---

## 2. Objective Description
Implement the complete end-to-end purchasing lifecycle: client shopping cart state management with a floating mobile cart dock, a resilient backend transactional order submission endpoint (`POST /api/v1/orders`) utilizing row-level database locks (`SELECT ... FOR UPDATE`) sorted by product ID to prevent deadlocks and race conditions, cryptographic guest token generation, and the customer checkout and order confirmation interface with WhatsApp coordination handoff.

---

## 3. Specific Technical Tasks Checklist

### 3.1 Client Shopping Cart State & UI Components
- [ ] Implement cart state in `apps/web/src/context/cart-context.tsx` and custom hook `hooks/use-cart.ts`:
  - [ ] Store cart items in browser `localStorage` under key `santo_cart_items`.
  - [ ] Cart state actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`.
  - [ ] Strict quantity validation: positive integers only ($q \ge 1$).
  - [ ] Computed values: `totalItemsCount`, `subtotalAmountIdr`.
- [ ] Implement `components/quantity-stepper.tsx`:
  - [ ] Circular decrement and increment buttons with touch targets $\ge 32\text{px}$.
  - [ ] When quantity is 1, decrement button transitions visually to a red trash icon (`--color-error: #ba1a1a`) to represent item removal.
  - [ ] Includes `data-testid="quantity-stepper"`.
- [ ] Implement `components/cart-dock.tsx` (Floating Mobile Cart Dock):
  - [ ] Fixed position pinned above the device bottom safe area on mobile viewports (< 640px).
  - [ ] Displays total item count, bold formatted Indonesian Rupiah grand total (`formatIdr`), and primary button *"Lihat Keranjang"*.
  - [ ] Automatically hidden if cart is empty.
  - [ ] Includes `data-testid="cart-dock"`.
- [ ] Implement `components/cart-drawer.tsx`:
  - [ ] Sliding sheet drawer displaying cart item list with thumbnail, unit price, quantity stepper, and line total.
  - [ ] Summary breakdown (Subtotal, Total).
  - [ ] CTA button *"Lanjut ke Pembayaran"* routing to `/checkout`.

### 3.2 Backend Transactional Order Placement API
- [ ] Implement `modules/orders/order-repository.ts` and `order-service.ts`:
  - [ ] Endpoint: `POST /api/v1/orders`
  - [ ] Validate request body using shared Zod schema `createOrderSchema`:
    - [ ] `customer_name` (non-empty string, trimmed).
    - [ ] `whatsapp_number` (validated and sanitized to ID standard `628...`).
    - [ ] `payment_method` (`bank_transfer` or `pay_at_store`).
    - [ ] `items` (array with `product_id`, integer `quantity > 0`, `expected_price_idr`).
  - [ ] Enforce required `Idempotency-Key` HTTP header:
    - [ ] Calculate SHA-256 checksum of normalized items payload (`payload_hash`).
    - [ ] Check if `idempotency_key` exists in `orders` table:
      - [ ] If exists with identical `payload_hash`, return existing order with `200 OK` (idempotent replay).
      - [ ] If exists with different `payload_hash`, throw `409 Conflict` with code `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`.
  - [ ] Execute order placement within a strict PostgreSQL ACID transaction (`BEGIN` ... `COMMIT`):
    - [ ] **Row Locking**: Query `inventory` for all requested product IDs using:
      ```sql
      SELECT product_id, on_hand, reserved 
      FROM inventory 
      WHERE product_id = ANY($1) 
      ORDER BY product_id ASC 
      FOR UPDATE;
      ```
      *(Strict ascending ordering prevents database deadlocks during concurrent multi-item checkouts).*
    - [ ] **Stock Verification**: Check that `(on_hand - reserved) >= requested_quantity` for every item.
      - [ ] If any product is insufficient, abort transaction and return `422 Unprocessable Entity` with code `INSUFFICIENT_STOCK` and details indicating the deficient product.
    - [ ] **Price Integrity Check**: Query `products` prices and ensure each matches `expected_price_idr`.
      - [ ] If price changed, abort transaction and return `409 Conflict` with code `PRICE_CHANGED`.
    - [ ] **Reserve Inventory**: Increment `reserved` by `quantity` for each product:
      ```sql
      UPDATE inventory 
      SET reserved = reserved + $1, updated_at = NOW() 
      WHERE product_id = $2;
      ```
    - [ ] **Create Master Order**:
      - [ ] Generate human-readable reference code: `ORD-YYYYMM-XXXX` (using atomic sequence or random formatted alphanumeric).
      - [ ] Generate 128-bit cryptographically secure random token (`crypto.randomBytes(16).toString('hex')`), prefix with `gsec_`.
      - [ ] Compute SHA-256 hash of token to store in `orders.guest_token_hash`.
      - [ ] Set `guest_token_expires_at` to `NOW() + INTERVAL '30 days'`.
      - [ ] Calculate `total_amount_idr` as sum of line item totals.
      - [ ] Insert into `orders` with `order_state = 'submitted'`, `payment_state = 'pending'`.
    - [ ] **Snapshot Line Items**:
      - [ ] Insert rows into `order_items` recording snapshot `name_snapshot`, `unit_snapshot`, `price_idr_snapshot`, `quantity`, and `line_total_idr`.
    - [ ] **Audit Trail**:
      - [ ] Insert into `order_status_history` (`from_state: 'none'`, `to_state: 'submitted'`, `actor_type: 'customer'`).
  - [ ] Construct preformatted WhatsApp message and URL:
    - [ ] Generate URL `https://wa.me/<store_whatsapp>?text=<encoded_text>` containing reference code, customer name, items summary, and total IDR.
  - [ ] Return `201 Created` with full order envelope, `guest_access_token`, `guest_tracking_url`, and `whatsapp_url`.
  - [ ] Privacy guarantee: Ensure plaintext `guest_access_token` is never logged in server request logs.

### 3.3 Customer Checkout & Confirmation Views
- [ ] Implement `components/payment-method-selector.tsx`:
  - [ ] Radio cards for **Transfer Bank** (`bank_transfer`) and **Bayar di Toko** (`pay_at_store`).
  - [ ] Selected card receives 2px Daun Segar Green border (`#16a34a`) and light green background (`#f0fdf4`).
  - [ ] Includes payment notes (e.g., instructions for bank transfer or cash at store).
  - [ ] Includes `data-testid="payment-method-selector"`.
- [ ] Build Checkout view `routes/checkout.tsx`:
  - [ ] Mobile-first single-column form (tablet/desktop 2-column with sticky order summary).
  - [ ] Input fields: Customer Name (`data-testid="input-customer-name"`) and WhatsApp Number (`data-testid="input-whatsapp-number"`).
  - [ ] Integrated `PaymentMethodSelector`.
  - [ ] Client pre-submission idempotency key generator (`crypto.randomUUID()`).
  - [ ] Submit button *"Konfirmasi Pesanan"* with loading spinner and disabled state during submission.
  - [ ] Error alert handling (handling `INSUFFICIENT_STOCK` by showing which item ran out and prompting cart refresh).
- [ ] Build Order Confirmation view `routes/order-confirmation.tsx`:
  - [ ] Success banner with reference code (e.g., `ORD-202610-0042`).
  - [ ] Store pickup address and operating hours badge.
  - [ ] Detailed item summary and total Rupiah payment amount.
  - [ ] Bank account instructions card (if `bank_transfer` selected).
  - [ ] Primary CTA button *"Kirim Bukti / Konfirmasi via WhatsApp"* opening preformatted WhatsApp chat in new tab.
  - [ ] Guest tracking link callout with one-click copy button.
  - [ ] Automatically clears shopping cart in `localStorage` upon successful placement.

### 3.4 Concurrency & Integrity Testing
- [ ] Write concurrency integration test (`test/concurrency/order-checkout.test.ts`):
  - [ ] Seed a product with `on_hand: 1` and `reserved: 0`.
  - [ ] Fire 5 simultaneous asynchronous `POST /api/v1/orders` requests competing for quantity 1 with unique idempotency keys.
  - [ ] Verify that exactly 1 request succeeds with `201 Created` and remaining 4 fail with `422 INSUFFICIENT_STOCK`.
  - [ ] Verify `inventory.reserved` equals 1 and database constraint `on_hand >= reserved` remains unbroken.
- [ ] Test deadlock prevention by firing concurrent multi-item orders with reversed product order arrays.
- [ ] Test idempotency replay: identical payload with same key returns identical order reference code; different payload returns 409.

---

## 4. Acceptance Criteria
1. **Concurrency & Atomicity**:
   - Under heavy simulated concurrent checkout traffic, zero overselling occurs.
   - Database constraint `chk_on_hand_ge_reserved` is never violated.
   - Deadlocks are prevented by sorting product locks in ascending order.
2. **Idempotency Enforcement**:
   - Re-submitting an order with the same `Idempotency-Key` and matching payload returns `200/201` without double-reserving inventory.
   - Re-submitting with the same key but different items or price returns `409 Conflict`.
3. **Security & Privacy**:
   - Plaintext guest tokens are never stored in the database (only SHA-256 hashes).
   - Plaintext guest tokens never appear in server log files.
4. **Checkout User Experience**:
   - Checkout flow works seamlessly on 360px viewport with no horizontal overflow.
   - Floating cart dock dynamically updates item count and total IDR as quantities change.
   - Order confirmation presents accurate reference code, bank instructions (when applicable), and working WhatsApp handoff link.
5. **Code & Test Standards**:
   - 0 lint errors, 0 typecheck errors, 100% passing concurrency and integration test suite.
