# TICKET-06: Staff Operations Dashboard, Inventory Adjustments, & Store Administration

## 1. Ticket Information
* **Ticket ID**: `TICKET-06`
* **Title**: Staff Operations Dashboard, Inventory Adjustments, & Store Administration
* **Phase**: 6 — Administrative Portal & Store Operations
* **Estimated Effort**: 4 Days
* **Dependencies**: `TICKET-01`, `TICKET-02`, `TICKET-03`, `TICKET-04`, `TICKET-05`
* **Governing Specifications**:
  * [`SPEC.md`](file:///Users/shofwanasy/projects/santo-groceries/SPEC.md) §1, §4.1, §4.2, §5
  * [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §2.3, §2.4, §4.1
  * [`docs/api/contracts.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/contracts.md) §4
  * [`docs/architecture/data-model.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/data-model.md) §2.2, §2.3, §2.4, §2.6, §2.7, §2.8
  * [`docs/testing/automation-selectors.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/testing/automation-selectors.md) §3

---

## 2. Objective Description
Develop the authenticated staff back-office management portal (`apps/web/src/routes/staff/*`) and corresponding protected administrative backend APIs (`/api/v1/staff/*`). Deliver comprehensive operational tools for real-time order lifecycle fulfillment (payment confirmation, order preparation, in-store collection, and stock-releasing order cancellation with mandatory audit reasons), manual inventory stock balance adjustments with reason logging, product catalog administration with image uploading, and store configuration management.

---

## 3. Specific Technical Tasks Checklist

### 3.1 Staff Authentication & Role Middleware
- [ ] Implement staff auth module in `apps/api/src/modules/staff-auth`:
  - [ ] `POST /api/v1/staff/auth/login`:
    - [ ] Authenticate staff username and password against `staff_users` table using Bcrypt.
    - [ ] Issue dedicated secure `HttpOnly` staff session cookie (`santo_staff_session`).
    - [ ] Return staff profile (`id`, `username`, `role`).
  - [ ] `POST /api/v1/staff/auth/logout`:
    - [ ] Clear staff session cookie.
  - [ ] Implement `middlewares/require-staff-auth.ts`:
    - [ ] Intercept all requests under `/api/v1/staff/*`.
    - [ ] Validate session; return `401 Unauthorized` if unauthenticated.
    - [ ] Verify `staff_users.is_active = true`; return `403 Forbidden` if account is deactivated.

### 3.2 Staff Order Processing Endpoints
- [ ] Implement `modules/orders/staff-order-controller.ts`:
  - [ ] `GET /api/v1/staff/orders`:
    - [ ] Support query filters: `order_state` (`submitted`, `accepted`, `preparing`, `ready_for_pickup`, `collected`, `cancelled`), `payment_state` (`pending`, `confirmed`), and `search` (matching `reference_code` or `customer_name`).
    - [ ] Return list of orders with line item summary, customer contact, and timestamps, ordered by `created_at DESC`.
  - [ ] `GET /api/v1/staff/orders/:id`:
    - [ ] Return full order details including line items snapshot and state transition audit trail from `order_status_history`.
  - [ ] `PATCH /api/v1/staff/orders/:id/payment`:
    - [ ] Request body: `{ "payment_state": "confirmed" }`.
    - [ ] Update `orders.payment_state = 'confirmed'`.
    - [ ] Insert audit log into `order_status_history` (`actor_type: 'staff'`, `actor_id: staff.id`, `notes: 'Pembayaran dikonfirmasi staf'`).
  - [ ] `PATCH /api/v1/staff/orders/:id/state`:
    - [ ] Request body: `{ "state": "accepted" | "preparing" | "ready_for_pickup" | "collected" }`.
    - [ ] Validate allowed lifecycle transitions:
      - `submitted` $\rightarrow$ `accepted`
      - `accepted` $\rightarrow$ `preparing`
      - `preparing` $\rightarrow$ `ready_for_pickup`
      - `ready_for_pickup` $\rightarrow$ `collected`
    - [ ] **Strict Collection Gate**: If target state is `collected`, verify `order.payment_state === 'confirmed'`. If not confirmed, reject with `422 Unprocessable Entity` (`INVALID_STATE_TRANSITION`, message: *"Pesanan belum dapat diselesaikan karena pembayaran belum lunas"*).
    - [ ] **Inventory Settlement on `collected`**:
      - Inside a PostgreSQL transaction, for each item in `order_items`:
        ```sql
        UPDATE inventory 
        SET on_hand = on_hand - $1, 
            reserved = reserved - $1, 
            updated_at = NOW() 
        WHERE product_id = $2;
        ```
    - [ ] Update `orders.order_state = target_state`.
    - [ ] Insert entry into `order_status_history`.
  - [ ] `POST /api/v1/staff/orders/:id/cancel`:
    - [ ] Request body:
      ```json
      {
        "reason": "string",
        "reason_category": "incorrect_stock" | "customer_request" | "abandoned_unpaid",
        "refund_notes": "optional string",
        "refund_bank_ref": "optional string",
        "refund_date": "optional YYYY-MM-DD"
      }
      ```
    - [ ] Validation: If `payment_state === 'confirmed'`, `refund_notes` is strictly mandatory.
    - [ ] Guard: If order is already `collected`, cancel is blocked with `422 INVALID_STATE_TRANSITION`.
    - [ ] **Inventory Release on Cancel**:
      - Inside a PostgreSQL transaction, for each item in `order_items`:
        ```sql
        UPDATE inventory 
        SET reserved = reserved - $1, 
            updated_at = NOW() 
        WHERE product_id = $2;
        ```
    - [ ] Update `orders.order_state = 'cancelled'`, set `cancellation_reason`, `refund_notes`, `refund_bank_ref`, `refund_date`.
    - [ ] Insert audit log into `order_status_history`.

### 3.3 Staff Catalog, Inventory, & Store Settings Endpoints
- [ ] Implement `modules/products/staff-product-controller.ts`:
  - [ ] `POST /api/v1/staff/products`:
    - [ ] Validate with `createProductSchema` (name, category, selling unit, non-negative integer `price_idr`).
    - [ ] Insert product and initialize corresponding `inventory` row (`on_hand: 0`, `reserved: 0`).
  - [ ] `PATCH /api/v1/staff/products/:id`:
    - [ ] Update product name, category, price, or `is_active` flag.
  - [ ] `POST /api/v1/staff/products/:id/image`:
    - [ ] Handle `multipart/form-data` upload with `multer`.
    - [ ] Validate file size ($\le 5\text{MB}$) and MIME type (`image/jpeg`, `image/webp`).
    - [ ] Delegate upload to `ImageStorageService` and update `products.image_url`.
- [ ] Implement `modules/inventory/staff-inventory-controller.ts`:
  - [ ] `POST /api/v1/staff/inventory/adjust`:
    - [ ] Request body: `{ "product_id": "UUID", "change_qty": integer, "reason": "string" }`.
    - [ ] In a transaction with `SELECT ... FOR UPDATE` on `inventory`:
      - [ ] Check constraint guard: Ensure `on_hand + change_qty >= reserved`. If violated, abort transaction and return `422 INSUFFICIENT_STOCK` (*"Stok fisik tidak dapat dikurangi di bawah jumlah yang sedang di-reserve"*).
      - [ ] Update `inventory.on_hand = on_hand + change_qty`.
      - [ ] Insert audit log into `inventory_adjustments` (`product_id`, `actor_id: staff.id`, `change_qty`, `reason`).
- [ ] Implement `modules/store-settings/staff-settings-controller.ts`:
  - [ ] `PATCH /api/v1/staff/store-settings`:
    - [ ] Validate with `updateStoreSettingsSchema` (shop name, address, pickup hours, official WhatsApp, bank instructions).
    - [ ] Update singleton row (`id = 1`) in `store_settings`.

### 3.4 Staff Back-Office Dashboard UI (`apps/web`)
- [ ] Implement Staff Layout and Views:
  - [ ] `routes/staff/login.tsx`: Clean staff authentication form with username and password.
  - [ ] `routes/staff/layout.tsx`: Desktop-optimized operational header with navigation tabs (**Antrean Pesanan**, **Katalog & Stok**, **Pengaturan Toko**) and staff profile logout button.
- [ ] Build **Antrean Pesanan** (Order Queue View):
  - [ ] Filter chips: Status Pesanan (*Semua*, *Diajukan*, *Diterima*, *Disiapkan*, *Siap Diambil*, *Selesai*, *Dibatalkan*), Status Pembayaran (*Semua*, *Belum Lunas*, *Lunas*).
  - [ ] Search input for order reference code and customer name (`data-testid="staff-order-search"`).
  - [ ] Dense data table displaying Order Code, Customer Name, WhatsApp Link button, Total Rupiah, Payment Pill, State Pill, and Action CTA.
  - [ ] Order Detail Modal/Drawer (`components/staff-order-detail-modal.tsx`):
    - [ ] Detailed item breakdown and snapshot prices.
    - [ ] Customer contact with direct click-to-chat WhatsApp button.
    - [ ] "Konfirmasi Pembayaran" toggle button.
    - [ ] Stepper advance button (e.g., *"Terima Pesanan"*, *"Mulai Siapkan"*, *"Tandai Siap Diambil"*, *"Selesaikan Pesanan"*).
    - [ ] "Batalkan Pesanan" dialog with required reason category selector and refund notes textarea.
- [ ] Build **Katalog & Stok** (Inventory Management View):
  - [ ] Table displaying Product Image, Name, Category, Price, `on_hand`, `reserved`, `available` stock, and Active/Inactive toggle switch.
  - [ ] "Tambah Produk Baru" modal with image file picker.
  - [ ] "Ubah Stok" modal (`components/stock-adjustment-modal.tsx`):
    - [ ] Delta quantity input (+/- integer) with live preview of new `on_hand` and `available`.
    - [ ] Reason input with pre-filled suggestions (*Restock dari Pemasok*, *Barang Rusak/Pecah*, *Penjualan Offline Langsung*).
- [ ] Build **Pengaturan Toko** (Store Settings View):
  - [ ] Form for editing store profile, physical pickup address, operating hours, WhatsApp business phone number, and bank account instructions.
  - [ ] Save button with instant validation and success toast alert.
- [ ] Operational Verification:
  - [ ] Verify that no AI or LLM dependencies are included in any dashboard or backend workflow.

---

## 4. Acceptance Criteria
1. **Staff Authentication & Route Guards**:
   - Unauthenticated requests to `/api/v1/staff/*` or `/staff/*` are rejected with `401 Unauthorized` or redirected to `/staff/login`.
2. **Order Lifecycle Integrity**:
   - Advancing order through `Diajukan` $\rightarrow$ `Diterima` $\rightarrow$ `Disiapkan` $\rightarrow$ `Siap Diambil` $\rightarrow$ `Selesai` executes correctly and is recorded in `order_status_history`.
   - Attempting to complete an order (`collected`) whose payment is `pending` is strictly blocked with `422`.
   - Completing an order (`collected`) decrements both `on_hand` and `reserved` stock by the ordered quantities.
3. **Cancellation & Inventory Release**:
   - Cancelling an order releases reserved inventory atomically.
   - Cancelling a paid order strictly requires refund documentation notes.
   - Already collected orders cannot be cancelled.
4. **Inventory Adjustments & Stock Constraints**:
   - Manual inventory adjustments log the staff actor ID and reason.
   - An adjustment that would reduce `on_hand` below active `reserved` quantities is rejected by the transaction.
5. **Product & Image Management**:
   - Creating a product automatically initializes inventory balances to 0.
   - Image upload validates file size $\le 5\text{MB}$ and format, saving via `ImageStorageService`.
6. **Store Settings Synchronization**:
   - Updates to store settings in the staff dashboard immediately update public `/api/v1/store-settings` and storefront banners.
7. **Code & Test Standards**:
   - 0 lint errors, 0 typecheck errors, 100% passing test suite across administrative endpoints.
