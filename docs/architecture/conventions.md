# Code Conventions & Engineering Standards

Status: Authoritative Engineering Guidelines  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §4  
Last Updated: 2026-10-09  

---

## 1. TypeScript Strictness & Type Safety

Both frontend and backend codebases must enable strict TypeScript settings in `tsconfig.json`:
* `"strict": true` (includes `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`)
* `"noUncheckedIndexedAccess": true`
* `"exactOptionalPropertyTypes": true`

### 1.1 Type Sharing
Shared domain types (such as `OrderState`, `PaymentState`, `PaymentMethod`, `Product`, `OrderItemSnapshot`, and standard error shapes) should be defined in a shared package or common types directory to avoid type drift between client and server.

---

## 2. Currency & Arithmetic Standards

1. **Integer Representation**:
   * All prices, line item totals, and order subtotals must use integer representations representing whole Indonesian Rupiah (`IDR`).
   * Never use JavaScript floating-point numbers (`Math.round(val * 100) / 100` is forbidden for currency).
   * In TypeScript: type `IdrAmount = number & { readonly __brand: unique symbol }` or integer `bigint`.
2. **Formatting Utility**:
   * Storefront display must format numbers using standard Indonesian currency formatting:
     ```typescript
     export function formatIdr(amount: number): string {
       return new Intl.NumberFormat('id-ID', {
         style: 'currency',
         currency: 'IDR',
         maximumFractionDigits: 0,
       }).format(amount);
     }
     // Example output: "Rp 15.000"
     ```

---

## 3. Database Transaction Patterns

* Every inventory mutation must execute within an explicit database transaction.
* Row-level locking on inventory balances is mandatory during checkout:
  ```sql
  SELECT product_id, on_hand, reserved 
  FROM inventory 
  WHERE product_id IN ($1, $2) 
  FOR UPDATE;
  ```
* Transactions must handle deadlocks by using deterministic ordering of locked IDs (e.g., sorting `product_id` ascending before locking).

---

## 4. Standardized Error Responses

All API error responses must adhere to a consistent JSON shape:

```typescript
interface ApiErrorResponse {
  error: {
    code: string;       // Machine-readable uppercase snake_case string (e.g. INSUFFICIENT_STOCK)
    message: string;    // Human-readable message in Bahasa Indonesia suitable for UI display
    details?: unknown;  // Optional validation errors or context
  };
}
```

### Standard Error Codes
* `INSUFFICIENT_STOCK` (`422`): Requested quantity exceeds available stock.
* `PRICE_CHANGED` (`409`): Current catalog price differs from cart snapshot.
* `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` (`409`): Idempotency key reused with mismatched items.
* `INVALID_STATE_TRANSITION` (`422`): Illegal order or payment lifecycle mutation.
* `UNAUTHORIZED` (`401`): Missing or invalid credentials/tokens.
* `FORBIDDEN` (`403`): Access to target resource not permitted.
* `NOT_FOUND` (`404`): Resource does not exist.

---

## 5. Logging & Privacy Rules

* **Zero Token Logging**: Secret guest access tokens, password hashes, and session cookies must be scrubbed from all logs.
* **PII Sanitization**: Customer WhatsApp numbers should be masked in application logs (e.g., `+62812****7890`).
* **Audit Trail Exemption**: Database audit log tables (`inventory_adjustments`, `order_status_history`) record designated actors and order references, never credentials.
