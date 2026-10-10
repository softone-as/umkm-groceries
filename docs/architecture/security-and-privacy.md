# Security & Privacy Specification

Status: Authoritative Security Baseline  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §4  
Last Updated: 2026-10-09  

---

## 1. Authentication & Authorization Architecture

### 1.1 Staff Authentication & Access Control
* **Staff Operations Guard**: Every staff endpoint (`/api/v1/staff/*`) requires authenticated session verification.
* **Session Storage**: Secure cookie-based session management (`HttpOnly`, `Secure`, `SameSite=Strict` or `Lax` on same-origin setup).
* **CSRF Mitigation**: Anti-CSRF token verification required on all state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
* **Password Security**: Staff passwords must be hashed using a modern, vetted hashing algorithm (`Argon2id` or `bcrypt` with appropriate work factors). Plaintext passwords must never touch storage or logs.
* **Brute-Force Rate Limiting**: Administrative login endpoints must enforce IP- and account-based rate limiting.

### 1.2 Customer Authorization & Access Boundary
* **No Cross-Customer Visibility**: Authenticated customers may only query orders where `customer_id == session.customer_id`.
* **Zero Customer Write Access**: Customers cannot directly alter order state, payment state, stock levels, or unit prices.
* **Customer Authentication Open Decision**: The final customer auth mechanism (e.g., password, magic email link, or lightweight token) remains an open design decision. Paid SMS or WhatsApp OTP authentication must not be assumed.

---

## 2. Guest Order Token Security

### 2.1 Cryptographic Guarantees
* **Entropy**: Guest access tokens must be generated using a cryptographically secure pseudorandom number generator (CSPRNG, e.g., `crypto.randomBytes(32)` providing 256 bits of entropy, well exceeding the 128-bit minimum).
* **Hashed Storage**: The plaintext token is returned to the guest browser once upon order creation. The database stores only the SHA-256 (or Argon2) hash of the token (`guest_token_hash`).
* **Non-Enumerable Routing**: Guest URLs use the format:
  ```text
  https://example.com/orders/guest?token=<high_entropy_token>
  ```
* **Order Reference Isolation**: Human-readable reference codes (e.g., `ORD-202610-0042`) alone **cannot** return private order details or customer PII. Requesting an order by reference code without a valid session or secret token must return an authorization failure (`401 Unauthorized` or `404 Not Found`).

---

## 3. Data Privacy & Minimization

### 3.1 Data Minimization
* Only data strictly required to complete the pickup order is gathered:
  * Customer Name (*Nama*)
  * WhatsApp Phone Number (*Nomor WhatsApp*)
* **Explicit Exclusions**: Guest ordering does not request home delivery addresses, email addresses, national identity card numbers (NIK), or bank account numbers.

### 3.2 WhatsApp Privacy Disclosure
* Clicking the prefilled WhatsApp link transfers customer name, order reference, and line items into WhatsApp's external client.
* The application UI must display a clear disclosure informing the customer that clicking the button will open WhatsApp and share their order summary with the store.
* No data is transmitted to WhatsApp servers by the application backend.

### 3.3 Indonesian Personal Data Protection (UU PDP) Compliance
* Store owner must review and formally approve:
  * Store privacy notice displayed on the website.
  * Personal data retention policy (duration before archiving or purging guest phone numbers).
  * Customer account deletion workflow.
* Sensitive customer phone numbers and guest access tokens must never be emitted into application logs, console logs, or APM traces.

---

## 4. Database Security & Backup Integrity

* **SQL Injection Prevention**: All queries must use parameterized SQL statements or type-safe query builders. Dynamic string concatenation for SQL is strictly forbidden.
* **Backup Recovery Verification**: Recoverable database backups must be scheduled and an end-to-end restoration drill must be successfully demonstrated before production launch.
