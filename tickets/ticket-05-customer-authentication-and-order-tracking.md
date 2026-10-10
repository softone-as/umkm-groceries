# TICKET-05: Customer Authentication, Account Dashboard, & Order Tracking

## 1. Ticket Information
* **Ticket ID**: `TICKET-05`
* **Title**: Customer Authentication, Account Dashboard, & Order Tracking
* **Phase**: 5 — Customer Account Management & Lifecycle Tracking
* **Estimated Effort**: 3 Days
* **Dependencies**: `TICKET-01`, `TICKET-02`, `TICKET-03`, `TICKET-04`
* **Governing Specifications**:
  * [`SPEC.md`](file:///Users/shofwanasy/projects/santo-groceries/SPEC.md) §1, §3.4, §4.1, §5.2
  * [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §2.4, §4.1
  * [`docs/api/contracts.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/contracts.md) §2.4, §3
  * [`docs/architecture/data-model.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/data-model.md) §2.4, §2.6, §2.8
  * [`docs/adr/0006-image-storage-customer-auth-monorepo.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/0006-image-storage-customer-auth-monorepo.md)

---

## 2. Objective Description
Build the customer identity and lifecycle tracking features: secure email/password customer authentication using Bcrypt/Argon2 with HttpOnly session cookies, non-enumerable guest order lookup via SHA-256 hashed secret tokens (`/orders/guest?token=...`), the visual `OrderStatusTimeline` stepper, authenticated customer order history management, and the ability to claim unlinked guest orders into a registered customer profile.

---

## 3. Specific Technical Tasks Checklist

### 3.1 Customer Authentication Backend Endpoints
- [ ] Implement `modules/customer-auth/customer-auth-repository.ts` and `customer-auth-service.ts`:
  - [ ] `POST /api/v1/customer/auth/register`:
    - [ ] Validate input with Zod schema `customerRegisterSchema` (name, email, strong password $\ge 8$ chars, valid WhatsApp phone).
    - [ ] Hash password using Bcrypt or Argon2id (`saltRounds: 12`).
    - [ ] Insert into `customer_accounts` table.
    - [ ] Return `201 Created` with created customer profile (excluding password hash).
  - [ ] `POST /api/v1/customer/auth/login`:
    - [ ] Validate credentials against `customer_accounts`.
    - [ ] Issue secure signed `HttpOnly` session cookie (`santo_customer_session`) with `SameSite: Lax`, `Secure` in production, `Max-Age: 30 days`.
    - [ ] Return `200 OK` with customer profile.
  - [ ] `POST /api/v1/customer/auth/logout`:
    - [ ] Clear session cookie (`200 OK`).
  - [ ] `GET /api/v1/customer/me`:
    - [ ] Middleware checks session cookie; returns active customer profile or `401 Unauthorized`.
  - [ ] `POST /api/v1/customer/auth/forgot-password`:
    - [ ] Generate 64-character hex reset token, store SHA-256 hash in `reset_token_hash` with 1-hour expiration in `reset_token_expires_at`.
    - [ ] Dispatches reset token (logged in dev / simulated email dispatch in MVP).
  - [ ] `POST /api/v1/customer/auth/reset-password`:
    - [ ] Verify token hash and expiration.
    - [ ] Update password hash and clear reset token fields (`200 OK`).

### 3.2 Guest Order Tracking API
- [ ] Implement `modules/orders/guest-order-controller.ts`:
  - [ ] Endpoint: `GET /api/v1/guest/orders/:token`
  - [ ] Extract secret token from route parameter.
  - [ ] Compute SHA-256 hash of the received token:
    ```typescript
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    ```
  - [ ] Query `orders` table matching `guest_token_hash = tokenHash` AND `guest_token_expires_at > NOW()`.
  - [ ] If not found or expired, return `404 Not Found` with standardized error code `NOT_FOUND` and message *"Pesanan tidak ditemukan atau tautan kedaluwarsa."*.
  - [ ] Return full order details, snapshot items from `order_items`, store pickup information, and current `order_state` and `payment_state`.

### 3.3 Customer Order History & Guest Claiming API
- [ ] Implement authenticated customer order endpoints:
  - [ ] `GET /api/v1/customer/orders`:
    - [ ] Requires customer authentication.
    - [ ] Returns list of orders where `customer_id = authenticated_customer_id`, ordered by `created_at DESC`.
  - [ ] `GET /api/v1/customer/orders/:id`:
    - [ ] Query order by UUID.
    - [ ] Verify authorization: if `order.customer_id !== authenticated_customer_id`, return `403 Forbidden` (`FORBIDDEN`).
    - [ ] Return detailed order with item snapshot list and timeline history.
  - [ ] `POST /api/v1/customer/orders/claim`:
    - [ ] Request body: `{ "guest_access_token": "string" }`.
    - [ ] Hash token with SHA-256 and look up target order.
    - [ ] If order does not exist or expired, return `404 Not Found`.
    - [ ] If order already has `customer_id IS NOT NULL`, return `409 Conflict` (*"Pesanan sudah tertaut dengan akun lain"*).
    - [ ] Execute database update setting `customer_id = authenticated_customer_id` and `guest_token_hash = NULL`.
    - [ ] Return `200 OK` with claimed order ID.

### 3.4 Order Status Timeline Stepper Component
- [ ] Implement `components/order-status-timeline.tsx`:
  - [ ] Renders sequential order states:
    1. **Diajukan** (`submitted`)
    2. **Diterima** (`accepted`)
    3. **Disiapkan** (`preparing`)
    4. **Siap Diambil** (`ready_for_pickup`)
    5. **Selesai** (`collected`)
  - [ ] Visual indicators:
    - [ ] Completed steps: filled Daun Segar Green circle (`#16a34a`) with checkmark icon and solid green connector line.
    - [ ] Active current step: pulsating green border with bold Indonesian label.
    - [ ] Upcoming steps: muted gray circle (`#cbd5e1`) and dashed connector line.
  - [ ] Special state handling:
    - [ ] If `order_state === 'cancelled'`, render distinct red alert banner displaying cancellation reason and instructions.
  - [ ] Include `data-testid="order-status-timeline"`.

### 3.5 Customer Frontend Views
- [ ] Implement Authentication Views:
  - [ ] `routes/auth/login.tsx`: Email and password input with validation errors and link to register.
  - [ ] `routes/auth/register.tsx`: Customer Name, Email, WhatsApp Phone, and Password input.
  - [ ] Client auth context `context/customer-auth-context.tsx` and hook `hooks/use-customer-auth.ts`.
- [ ] Implement Guest Order Tracking View `routes/orders/guest.tsx`:
  - [ ] Reads `token` query param (`/orders/guest?token=...`).
  - [ ] Displays `OrderStatusTimeline` stepper.
  - [ ] Displays store pickup instructions and address.
  - [ ] Displays item breakdown and payment status badge (*Menunggu Pembayaran* / *Sudah Dikonfirmasi*).
  - [ ] Floating action card: If user is logged in, show button *"Tautkan ke Akun Saya"* calling claim endpoint; if not logged in, prompt to log in and claim.
- [ ] Implement Customer Account Dashboard `routes/account/index.tsx`:
  - [ ] Customer profile card with name, email, and WhatsApp number.
  - [ ] Tabbed view: **Pesanan Aktif** (Active Orders) and **Riwayat Pesanan** (Order History).
  - [ ] Clickable order cards routing to order detail screen.
  - [ ] Logout button with confirmation modal.

### 3.6 Automated Testing
- [ ] Write integration tests (`test/integration/customer-auth.test.ts`):
  - [ ] Customer registration, duplicate email rejection (409 Conflict), login with correct/incorrect credentials, session cookie verification.
- [ ] Write integration tests (`test/integration/guest-order.test.ts`):
  - [ ] Guest token lookup succeeds with matching token.
  - [ ] Tampered or random token string returns 404.
  - [ ] Expired token returns 404.
- [ ] Write integration tests (`test/integration/order-claiming.test.ts`):
  - [ ] Successfully claim an unlinked guest order into authenticated customer account.
  - [ ] Re-claiming an already claimed order returns 409 Conflict.
  - [ ] Accessing another customer's order ID returns 403 Forbidden.

---

## 4. Acceptance Criteria
1. **Authentication Security**:
   - Customer passwords hashed with Bcrypt/Argon2; plain passwords never stored or logged.
   - Session cookies configured with `HttpOnly`, `SameSite: Lax`, and sanitized on logout.
2. **Guest Order Confidentiality & Access**:
   - Guest tracking URLs with valid tokens display accurate real-time order state.
   - Guessing or tampering with guest tokens yields 404 without leaking other orders.
3. **Guest Order Claiming**:
   - An authenticated customer can claim a guest order using the secret token; subsequent queries attribute the order to the customer.
   - Claimed orders cannot be re-claimed by another customer account.
4. **Data Isolation & Access Control**:
   - A customer attempting to view another customer's order by UUID receives `403 Forbidden`.
5. **Timeline Stepper UX**:
   - `OrderStatusTimeline` clearly highlights current state in Bahasa Indonesia and adapts dynamically to cancelled states.
6. **Code Quality**:
   - 0 lint errors, 0 typecheck errors, 100% passing test suite for auth and order tracking.
