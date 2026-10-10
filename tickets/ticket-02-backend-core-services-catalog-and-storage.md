# TICKET-02: Backend Core Services, Catalog REST API, & Media Storage

## 1. Ticket Information
* **Ticket ID**: `TICKET-02`
* **Title**: Backend Core Services, Catalog REST API, & Media Storage
* **Phase**: 2 — Backend Services & Catalog Read APIs
* **Estimated Effort**: 3 Days
* **Dependencies**: `TICKET-01`
* **Governing Specifications**:
  * [`SPEC.md`](file:///Users/shofwanasy/projects/santo-groceries/SPEC.md) §1, §2, §4.1, §5
  * [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §4.1
  * [`docs/api/contracts.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/api/contracts.md) §1, §2.1, §2.2
  * [`docs/architecture/security-and-privacy.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/security-and-privacy.md)
  * [`docs/adr/0006-image-storage-customer-auth-monorepo.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/0006-image-storage-customer-auth-monorepo.md)

---

## 2. Objective Description
Scaffold the backend REST service in `apps/api` using Express.js and strict TypeScript. Establish essential architectural middleware: security headers via Helmet, JSON body parsing, standardized JSON response wrapping (`ApiSuccessResponse` and `ApiErrorResponse`), global error interception with Zod validation mapping, and privacy-compliant request logging (ensuring WhatsApp numbers are masked and sensitive tokens are scrubbed). Implement the modular `ImageStorageService` interface and its local disk adapter (`/uploads/images`), followed by the public storefront endpoints for fetching the active grocery catalog (`GET /api/v1/products`) and store configuration (`GET /api/v1/store-settings`).

---

## 3. Specific Technical Tasks Checklist

### 3.1 Express Server Scaffolding & Architecture
- [ ] Scaffold `apps/api/src/server.ts` and `apps/api/src/app.ts` with graceful shutdown handling (`SIGTERM`, `SIGINT`).
- [ ] Install and configure foundational middleware:
  - [ ] `cors`: Configure CORS with configurable origin whitelists for local and production web clients.
  - [ ] `helmet`: Configure secure HTTP headers.
  - [ ] `express.json()` and `express.urlencoded({ extended: true })`.
  - [ ] `cookie-parser`: Configure cookie parser for session cookies.
- [ ] Implement standardized response helper middleware:
  - [ ] `res.sendSuccess(data, meta?)`: Formats output according to `ApiSuccessResponse<T>`.
  - [ ] `res.sendError(code, message, details?, status?)`: Formats output according to `ApiErrorResponse`.
- [ ] Implement global error-handling middleware (`middlewares/error-handler.ts`):
  - [ ] Intercept Zod validation errors and format into `422 Unprocessable Entity` with field-level error messages in Bahasa Indonesia.
  - [ ] Map internal custom domain errors (`NotFoundError`, `ConflictError`, `InsufficientStockError`) to appropriate HTTP status codes and standard codes.
  - [ ] Intercept unexpected errors and return safe `500 Internal Server Error` with generic Indonesian copy (`"Terjadi kesalahan pada sistem."`), preventing stack trace leakage in production.

### 3.2 Privacy & Security Logging Middleware
- [ ] Implement request logging middleware (`middlewares/request-logger.ts`):
  - [ ] Mask customer WhatsApp and phone numbers in all query params, request bodies, and log streams (e.g., transform `081234567890` into `+62812****7890`).
  - [ ] Scrub sensitive parameters from log entries: `password`, `password_hash`, `guest_access_token`, `token`, `session_cookie`.
  - [ ] Assign unique `x-request-id` header to incoming requests for tracing.

### 3.3 Modular Media Storage Adapter
- [ ] Define abstract storage interface `services/image-storage-service.ts`:
  ```typescript
  export interface ImageStorageService {
    upload(file: Express.Multer.File): Promise<string>;
    delete(fileUrl: string): Promise<void>;
  }
  ```
- [ ] Implement `LocalDiskImageStorageAdapter` (`services/local-disk-storage-adapter.ts`):
  - [ ] Ensure target directory `/uploads/images` exists at server startup.
  - [ ] Process file uploads using `multer` with strict validation:
    - [ ] File size limit: strictly $\le 5\text{MB}$.
    - [ ] Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
    - [ ] Sanitize file names with unique UUID prefixes to prevent overwrites or directory traversal attacks.
  - [ ] Return public URL path format: `/uploads/images/<uuid>-<filename>`.
- [ ] Mount Express static file serving middleware on `/uploads/images` serving files securely with cache-control headers.

### 3.4 Products Catalog & Store Settings Services
- [ ] Implement database repository layer:
  - [ ] `modules/products/product-repository.ts`:
    - [ ] Query active products (`is_active = true`) joined with `inventory` table.
    - [ ] Calculate available stock dynamically in SQL: `(inventory.on_hand - inventory.reserved) AS available_quantity`.
    - [ ] Filter by `category` (exact match) when provided.
    - [ ] Filter by `search` (case-insensitive substring `ILIKE %search%` across `name`) when provided.
    - [ ] Order by category ascending, followed by product name ascending.
  - [ ] `modules/store-settings/store-settings-repository.ts`:
    - [ ] Query singleton row where `id = 1` from `store_settings`.
- [ ] Implement service and controller layers:
  - [ ] `modules/products/product-service.ts` & `product-controller.ts`:
    - [ ] Implement `GET /api/v1/products`: Returns list of products with `id`, `name`, `category`, `selling_unit`, `price_idr`, `image_url`, `available_quantity`, and boolean `is_available` (`available_quantity > 0`).
  - [ ] `modules/store-settings/store-settings-service.ts` & `store-settings-controller.ts`:
    - [ ] Implement `GET /api/v1/store-settings`: Returns store profile (`shop_name`, `address`, `pickup_hours`, `whatsapp_number`, `bank_transfer_instructions`).
- [ ] Wire routers into base router under `/api/v1`.

### 3.5 Automated Testing
- [ ] Write integration test suite using Supertest (`test/integration/products.test.ts`):
  - [ ] `GET /api/v1/products` returns 200 with formatted catalog.
  - [ ] Inactive products (`is_active: false`) are strictly excluded from response.
  - [ ] Dynamic calculation: product with `on_hand: 10` and `reserved: 3` returns `available_quantity: 7` and `is_available: true`.
  - [ ] Out of stock calculation: product with `on_hand: 5` and `reserved: 5` returns `available_quantity: 0` and `is_available: false`.
  - [ ] Query param filtering by category and search term.
  - [ ] `GET /api/v1/store-settings` returns 200 with configured store information.
- [ ] Write unit test for `LocalDiskImageStorageAdapter` verifying file upload constraints and directory traversal rejection.

---

## 4. Acceptance Criteria
1. **API Envelope Compliance**:
   - Every successful response adheres to `{ "success": true, "data": ... }`.
   - Every error response adheres to `{ "success": false, "error": { "code": string, "message": string, "details"?: ... } }`.
2. **Catalog Integrity & Stock Calculation**:
   - `GET /api/v1/products` returns all active products with computed available stock.
   - Deactivated products never leak into storefront catalog responses.
   - If `on_hand == reserved`, `available_quantity` returns `0` and `is_available` is `false`.
3. **Search & Filtering**:
   - `GET /api/v1/products?category=Beras` returns only rice products.
   - `GET /api/v1/products?search=goreng` returns matching items regardless of casing.
4. **Logging Privacy Compliance**:
   - Verification test confirms no phone numbers appear in plaintext within log outputs.
   - Zero sensitive tokens or credentials in log output.
5. **Static Media Serving**:
   - Uploaded test image stored in `/uploads/images` can be retrieved via HTTP GET with appropriate MIME type and cache headers.
6. **Code Quality**:
   - 0 lint errors, 0 typecheck errors, 100% passing test suite for catalog endpoints.
