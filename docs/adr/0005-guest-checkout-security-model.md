# ADR 0005: Guest Checkout Security & Token Model

## Status
Accepted

## Date
2026-10-09

## Context
Requiring mandatory account registration and password creation increases friction and causes checkout abandonment in neighborhood retail. To provide an optimal experience, guest checkout must be supported without requiring accounts. However, naive guest lookup (e.g., searching by order number or customer phone number) creates severe privacy vulnerabilities, allowing anyone to enumerate orders, discover customer phone numbers, or view purchase habits.

PRD §4 requires:
1. Human-readable order references alone cannot retrieve private order details.
2. Guest lookup uses a non-enumerable secret link separate from the reference code.
3. Secret tokens must have $\ge 128$ bits of cryptographic randomness and be stored hashed in the database.
4. Tokens must not be included in WhatsApp messages or web analytics.

## Decision
1. **Dual Identifier Architecture**:
   * **Public Reference Code** (`reference_code`, e.g., `ORD-202610-0042`): Displayed on receipts, prefilled in WhatsApp text, and used by staff to look up orders physically. Cannot be used by anonymous web requests to fetch personal data.
   * **Secret Access Token** (`guest_access_token`): Generated at checkout using CSPRNG (`crypto.randomBytes(32)`, 256 bits). Returned to the customer's browser once in the checkout response.
2. **Hashed Persistence**: The database stores only the SHA-256 hash (`guest_token_hash`). If the database is compromised, plaintext access tokens cannot be extracted.
3. **Dedicated Guest Endpoint**: Order lookup for guests is exposed exclusively at `GET /api/v1/guest/orders/:token`, which hashes the provided token in constant time and queries matching records.
4. **WhatsApp Sanitization**: The prefilled WhatsApp text intentionally excludes the guest access token to prevent accidental exposure when forwarding messages.

## Consequences
* **Positive**:
  * Protects customer PII from enumeration and scraping attacks.
  * Allows frictionless guest purchasing with full status visibility.
  * Complies with PRD security invariants and modern privacy best practices.
* **Trade-off**:
  * If a guest customer loses their secret link and closes their browser, self-service order lookup is not possible without an agreed staff-mediated recovery policy.
