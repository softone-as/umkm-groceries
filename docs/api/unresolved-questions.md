# Resolved API & Design Decisions

Status: **All Open Decisions Resolved**  
Authoritative ADR: [`docs/adr/0006-resolved-mvp-open-decisions.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/0006-resolved-mvp-open-decisions.md)  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §4, §5  
Last Updated: 2026-10-10  

---

## 1. Overview

Per the review completed on 2026-10-10, all open architectural, API, and product decisions for the MVP have been formally agreed upon and documented. This file documents the resolution summary and links to the definitive contract and schema specifications.

---

## 2. Decision Log & Resolutions

### 2.1 Customer Authentication Mechanism
* **Status**: **Resolved**
* **Resolution**: Email & Password with standard email verification and password reset links. Zero SMS/WhatsApp API cost.
* **Specification**: See [`docs/api/contracts.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/contracts.md) §3 and [`docs/architecture/data-model.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/data-model.md) §2.8.
* **Key Endpoints**:
  * `POST /api/v1/customer/auth/register`
  * `POST /api/v1/customer/auth/login`
  * `POST /api/v1/customer/auth/logout`
  * `POST /api/v1/customer/auth/forgot-password`
  * `POST /api/v1/customer/auth/reset-password`
  * `GET /api/v1/customer/me`

### 2.2 Guest Link Expiry & Recovery Workflow
* **Status**: **Resolved**
* **Resolution**:
  * Guest access tokens have a **30-day TTL** from order creation (`guest_token_expires_at`).
  * If a guest customer closes their browser and loses the tracking link, recovery is handled **out-of-band by messaging staff on WhatsApp** with their name and order reference code (`reference_code`). Staff verify the customer and provide assistance from the staff dashboard. Direct public phone-number lookup remains strictly forbidden to preserve privacy.
* **Specification**: See [`docs/adr/0006-resolved-mvp-open-decisions.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/0006-resolved-mvp-open-decisions.md) §2.

### 2.3 Product Image Storage & Upload Contract
* **Status**: **Resolved**
* **Resolution**:
  * For local dev and MVP, store product images on local disk behind an Express static route (`/uploads/images`), parsed via `multipart/form-data` with multer.
  * Encapsulated behind a modular `ImageStorageService` interface to easily enable Cloudflare R2 / AWS S3 via environment variables. Max image size: 5MB; formats: WebP / JPEG.
* **Specification**: See [`docs/api/contracts.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/contracts.md) §4.2.

### 2.4 Staff Review Cadence & Refund Handling
* **Status**: **Resolved**
* **Resolution**:
  * Pending pickup orders have no automated cancellation in MVP; staff perform manual daily reviews.
  * When cancelling an order with confirmed payment, staff must provide structured audit details:
    * `reason_category`: `incorrect_stock` | `customer_request` | `abandoned_unpaid`
    * `refund_notes`: Mandatory text detailing refund settlement
    * `refund_bank_ref`: Optional bank transfer reference
    * `refund_date`: Optional ISO date
* **Specification**: See [`docs/api/contracts.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/contracts.md) §4.1.

### 2.5 Claiming Guest Orders into Registered Accounts
* **Status**: **Resolved**
* **Resolution**:
  * Authenticated customers can claim past guest orders into their account by submitting the guest secret access token via `POST /api/v1/customer/orders/claim`.
* **Specification**: See [`docs/api/contracts.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/contracts.md) §3.3.
