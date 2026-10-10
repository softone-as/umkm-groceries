# API Contracts & Interface Specification

Status: Approved REST Interfaces  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §4  
Last Updated: 2026-10-09  

---

## 1. Overview & General Headers

* **Base URL**: `/api/v1`
* **Content-Type**: `application/json`
* **Idempotency**: All mutation endpoints that create financial or inventory commitments support or require the `Idempotency-Key: <UUID>` request header.

---

## 2. Public Storefront Endpoints

### 2.1 Get Products Catalog
* **`GET /api/v1/products`**
* **Query Parameters**:
  * `category` *(optional string)*: Filter by category.
  * `search` *(optional string)*: Keyword search across product names.
* **Response (`200 OK`)**:
```json
{
  "products": [
    {
      "id": "e7b0a884-18c7-4d92-91e8-78c0e251a31b",
      "name": "Beras Rojolele Super 5kg",
      "category": "Beras",
      "selling_unit": "karung",
      "price_idr": 72000,
      "image_url": "/images/beras-rojolele.webp",
      "available_quantity": 14,
      "is_available": true
    }
  ]
}
```

### 2.2 Get Store Settings
* **`GET /api/v1/store-settings`**
* **Response (`200 OK`)**:
```json
{
  "shop_name": "Toko Sembako Berkah",
  "address": "Jl. Raya Pasar Minggu No. 42, Jakarta Selatan",
  "pickup_hours": "Senin - Sabtu: 08:00 - 17:00 WIB",
  "whatsapp_number": "6281234567890",
  "bank_transfer_instructions": "BCA 1234567890 a.n. Toko Berkah"
}
```

### 2.3 Submit Order
* **`POST /api/v1/orders`**
* **Headers**: `Idempotency-Key: <UUID>` (Required)
* **Request Body**:
```json
{
  "customer_name": "Budi Santoso",
  "whatsapp_number": "081234567890",
  "payment_method": "bank_transfer",
  "items": [
    {
      "product_id": "e7b0a884-18c7-4d92-91e8-78c0e251a31b",
      "quantity": 2,
      "expected_price_idr": 72000
    }
  ]
}
```
* **Success Response (`201 Created` or `200 OK` on idempotent retry)**:
```json
{
  "order": {
    "id": "f512da54-93b1-419b-a36c-9226cfd595ce",
    "reference_code": "ORD-202610-0042",
    "order_state": "submitted",
    "payment_state": "pending",
    "payment_method": "bank_transfer",
    "total_amount_idr": 144000,
    "whatsapp_url": "https://wa.me/6281234567890?text=Halo%2C%20saya%20sudah%20pesan%20ORD-202610-0042...",
    "guest_access_token": "gsec_98fbc18d4512e0a4f3c09b83e47...",
    "guest_tracking_url": "/orders/guest?token=gsec_98fbc18d4512e0a4f3c09b83e47...",
    "items": [
      {
        "product_id": "e7b0a884-18c7-4d92-91e8-78c0e251a31b",
        "name": "Beras Rojolele Super 5kg",
        "selling_unit": "karung",
        "unit_price_idr": 72000,
        "quantity": 2,
        "line_total_idr": 144000
      }
    ],
    "pickup_info": {
      "address": "Jl. Raya Pasar Minggu No. 42, Jakarta Selatan",
      "pickup_hours": "Senin - Sabtu: 08:00 - 17:00 WIB"
    }
  }
}
```
* **Error Responses**:
  * `422 Unprocessable Entity`: Stock exhausted (`INSUFFICIENT_STOCK`).
  * `409 Conflict`: Price mismatch (`PRICE_CHANGED`) or key reuse mismatch (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`).

### 2.4 Lookup Guest Order
* **`GET /api/v1/guest/orders/:token`**
* Validates hash of `:token`. Returns full order details and pickup status.
* `404 Not Found`: If token hash does not match an existing guest order.

---

## 3. Customer Account Endpoints (Registered)

### 3.1 Authentication
* **`POST /api/v1/customer/auth/register`**
  * Request: `{"name": "string", "email": "string", "password": "string", "phone_number": "string"}`
  * Response (`201 Created`): `{"message": "Registration successful. Please verify your email.", "user": {"id": "UUID", "name": "string", "email": "string"}}`
* **`POST /api/v1/customer/auth/login`**
  * Request: `{"email": "string", "password": "string"}`
  * Sets secure `HttpOnly` session cookie / returns session profile.
  * Response (`200 OK`): `{"user": {"id": "UUID", "name": "string", "email": "string", "phone_number": "string"}}`
* **`POST /api/v1/customer/auth/logout`**
  * Clears session cookie (`200 OK`).
* **`POST /api/v1/customer/auth/forgot-password`**
  * Request: `{"email": "string"}`
  * Dispatches password reset email token (`200 OK`).
* **`POST /api/v1/customer/auth/reset-password`**
  * Request: `{"token": "string", "new_password": "string"}`
  * Updates password hash and revokes reset token (`200 OK`).
* **`GET /api/v1/customer/me`**
  * Returns authenticated customer profile (`200 OK`).

### 3.2 Order History
* **`GET /api/v1/customer/orders`**: Lists orders placed by authenticated customer.
* **`GET /api/v1/customer/orders/:id`**: Returns details for customer's own order. (Denied with 403 Forbidden if owned by another customer).

### 3.3 Claim Guest Order
* **`POST /api/v1/customer/orders/claim`**
  * Authenticated endpoint to associate an unlinked guest order with the current customer account.
  * Request: `{"guest_access_token": "string"}`
  * Response (`200 OK`): `{"message": "Order successfully claimed", "order_id": "UUID"}`
  * Errors: `404 Not Found` (invalid or expired token), `409 Conflict` (already claimed by an account).

---

## 4. Staff Management Endpoints

All `/api/v1/staff/*` endpoints require active staff session authentication.

### 4.1 Order Processing
* **`GET /api/v1/staff/orders`**: List orders with filters (`order_state`, `payment_state`, `search=ORD-...`).
* **`GET /api/v1/staff/orders/:id`**: Detailed order inspection.
* **`PATCH /api/v1/staff/orders/:id/state`**:
  * Request: `{"state": "accepted" | "preparing" | "ready_for_pickup" | "collected"}`
  * Note: Transition to `collected` strictly blocked if `payment_state !== 'confirmed'`.
* **`PATCH /api/v1/staff/orders/:id/payment`**:
  * Request: `{"payment_state": "confirmed"}`
* **`POST /api/v1/staff/orders/:id/cancel`**:
  * Request:
    ```json
    {
      "reason": "string",
      "reason_category": "incorrect_stock" | "customer_request" | "abandoned_unpaid",
      "refund_notes": "string",
      "refund_bank_ref": "optional string",
      "refund_date": "optional YYYY-MM-DD"
    }
    ```
  * Note: `refund_notes` is mandatory if `payment_state === 'confirmed'`.
  * Releases reserved stock atomically. Blocked if order is already `collected`.

### 4.2 Catalog & Inventory Management
* **`POST /api/v1/staff/products`**: Create new catalog item.
* **`PATCH /api/v1/staff/products/:id`**: Update product details, price, or deactivation flag.
* **`POST /api/v1/staff/products/:id/image`**:
  * Upload product image via `multipart/form-data` (`image` file field, max 5MB, JPEG/WebP).
  * Stores to `/uploads/images/` and updates product `image_url`.
* **`POST /api/v1/staff/inventory/adjust`**:
  * Request: `{"product_id": "UUID", "change_qty": -5, "reason": "Kerusakan kemasan / pecah"}`
  * Blocked if adjustment would cause `on_hand < reserved`.

### 4.3 Store Settings Management
* **`PATCH /api/v1/staff/store-settings`**: Update address, pickup hours, WhatsApp phone, or bank transfer instructions.
