# TICKET-01: Project Initialization, Shared Domain Package, & Database Scaffolding

## 1. Ticket Information
* **Ticket ID**: `TICKET-01`
* **Title**: Project Initialization, Shared Domain Package, & Database Scaffolding
* **Phase**: 1 — Foundation & Core Scaffolding
* **Estimated Effort**: 3 Days
* **Dependencies**: None
* **Governing Specifications**:
  * [`SPEC.md`](file:///Users/shofwanasy/projects/santo-groceries/SPEC.md) §1, §2, §5
  * [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §4
  * [`docs/architecture/data-model.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/data-model.md)
  * [`docs/architecture/conventions.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/conventions.md)
  * [`docs/architecture/tech-stack.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/tech-stack.md)

---

## 2. Objective Description
Establish the foundational monorepo workspace for **Santo Groceries** (`apps/web`, `apps/api`, `packages/shared`) utilizing npm/pnpm workspaces and strict TypeScript compiler settings. Implement the core domain package (`packages/shared`) containing shared domain types, Zod validation schemas, Indonesian locale utilities (`formatIdr`, `calculateAvailableStock`, `asIdr`), and standardized API response envelopes. Define and execute PostgreSQL relational schema migrations encompassing all authoritative database tables, check constraints (specifically `chk_on_hand_ge_reserved`), indices, and an idempotent seed script.

---

## 3. Specific Technical Tasks Checklist

### 3.1 Monorepo Workspace Configuration
- [x] Initialize root `package.json` with workspace configuration (`workspaces: ["apps/*", "packages/*"]`) for npm/pnpm.
- [x] Define root `tsconfig.base.json` with strict compiler flags:
  - [x] `"strict": true`
  - [x] `"noImplicitAny": true`
  - [x] `"noUncheckedIndexedAccess": true`
  - [x] `"exactOptionalPropertyTypes": true`
  - [x] `"target": "ES2022"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
- [x] Establish ESLint and Prettier/Biome configurations enforcing strict TypeScript rules and kebab-case file naming convention.
- [x] Create workspace package stubs:
  - [x] `packages/shared/package.json`
  - [x] `apps/api/package.json`
  - [x] `apps/web/package.json`
- [x] Add root scripts for unified developer workflow (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run dev`).

### 3.2 Shared Domain Package (`packages/shared`)
- [x] Set up `packages/shared/src/index.ts` exporting all domain types, schemas, and utilities.
- [x] Implement domain entity types:
  - [x] `types/product-types.ts`: `Product`, `ProductCategory`, `SellingUnit`, `ProductSummary`.
  - [x] `types/inventory-types.ts`: `StockBalance`, `InventoryAdjustment`, `AdjustmentReasonCategory`.
  - [x] `types/order-types.ts`: `OrderState`, `PaymentState`, `PaymentMethod`, `OrderItemSnapshot`, `Order`, `OrderStatusHistoryEntry`.
  - [x] `types/store-types.ts`: `StoreSettings`.
  - [x] `types/auth-types.ts`: `StaffUser`, `StaffRole`, `CustomerAccount`.
- [x] Implement runtime validation schemas using Zod:
  - [x] `schemas/product-schemas.ts`: `createProductSchema`, `updateProductSchema`.
  - [x] `schemas/order-schemas.ts`: `createOrderSchema` (validating customer name, Indonesian phone number, payment method, items array with integer quantities and expected prices).
  - [x] `schemas/inventory-schemas.ts`: `inventoryAdjustmentSchema`.
  - [x] `schemas/auth-schemas.ts`: `customerRegisterSchema`, `customerLoginSchema`, `staffLoginSchema`, `resetPasswordSchema`.
  - [x] `schemas/store-schemas.ts`: `updateStoreSettingsSchema`.
- [x] Implement explicit utility functions with comprehensive JSDoc and unit tests:
  - [x] `utils/format-idr.ts`: `formatIdr(amount: number): string` (`Intl.NumberFormat('id-ID', ...)` without decimal fractions).
  - [x] `utils/calculate-stock.ts`: `calculateAvailableStock(balance: StockBalance): number` (`Math.max(0, onHand - reserved)`).
  - [x] `utils/branded-types.ts`: `IdrAmount` branded type and validator `asIdr(value: number): IdrAmount`.
  - [x] `utils/sanitize-phone.ts`: `sanitizePhoneNumber(phone: string): string` (standardizes to E.164 / ID standard `628...`).
- [x] Define standard API response contracts:
  - [x] `types/api-contracts.ts`: `ApiSuccessResponse<T>`, `ApiErrorResponse`.
  - [x] Standard error code constants: `INSUFFICIENT_STOCK`, `PRICE_CHANGED`, `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`, `INVALID_STATE_TRANSITION`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`.

### 3.3 Relational Database Schema & Migrations
- [x] Configure database client pool and migration framework in `apps/api` (e.g., node-postgres `pg`, Knex, or node-pg-migrate).
- [x] Write initial migration script creating core tables with exact types from `docs/architecture/data-model.md`:
  - [x] `products`: `id UUID PK`, `name VARCHAR(255)`, `category VARCHAR(100)`, `selling_unit VARCHAR(50)`, `price_idr BIGINT CHECK (price_idr >= 0)`, `image_url TEXT`, `is_active BOOLEAN DEFAULT true`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
  - [x] `inventory`: `product_id UUID PK FK`, `on_hand INTEGER CHECK (on_hand >= 0)`, `reserved INTEGER CHECK (reserved >= 0)`, `updated_at TIMESTAMPTZ`.
  - [x] Check constraint: `CONSTRAINT chk_on_hand_ge_reserved CHECK (on_hand >= reserved)`.
  - [x] `inventory_adjustments`: `id UUID PK`, `product_id UUID FK`, `actor_id UUID FK`, `change_qty INTEGER`, `reason VARCHAR(255)`, `created_at TIMESTAMPTZ`.
  - [x] `orders`: `id UUID PK`, `reference_code VARCHAR(32) UNIQUE`, `guest_token_hash VARCHAR(64)`, `customer_id UUID NULL FK`, `customer_name VARCHAR(150)`, `whatsapp_number VARCHAR(50)`, `order_state VARCHAR(30)`, `payment_state VARCHAR(30)`, `payment_method VARCHAR(30)`, `total_amount_idr BIGINT CHECK (total_amount_idr >= 0)`, `idempotency_key VARCHAR(128) UNIQUE`, `payload_hash VARCHAR(64)`, `cancellation_reason VARCHAR(255)`, `refund_notes TEXT`, `refund_bank_ref VARCHAR(100)`, `refund_date DATE`, `guest_token_expires_at TIMESTAMPTZ`, timestamps.
  - [x] `order_items`: `id UUID PK`, `order_id UUID FK ON DELETE CASCADE`, `product_id UUID FK`, `name_snapshot VARCHAR(255)`, `unit_snapshot VARCHAR(50)`, `price_idr_snapshot BIGINT`, `quantity INTEGER CHECK (quantity > 0)`, `line_total_idr BIGINT`.
  - [x] `order_status_history`: `id UUID PK`, `order_id UUID FK`, `from_state VARCHAR(30)`, `to_state VARCHAR(30)`, `actor_type VARCHAR(20)`, `actor_id UUID`, `notes TEXT`, `created_at TIMESTAMPTZ`.
  - [x] `store_settings`: `id INTEGER PK DEFAULT 1 CHECK (id = 1)`, `shop_name VARCHAR(150)`, `address TEXT`, `pickup_hours VARCHAR(255)`, `whatsapp_number VARCHAR(50)`, `bank_instructions TEXT`, `updated_at TIMESTAMPTZ`.
  - [x] `staff_users`: `id UUID PK`, `username VARCHAR(50) UNIQUE`, `password_hash VARCHAR(255)`, `role VARCHAR(30) DEFAULT 'staff'`, `is_active BOOLEAN DEFAULT true`, `created_at TIMESTAMPTZ`.
  - [x] `customer_accounts`: `id UUID PK`, `name VARCHAR(150)`, `email VARCHAR(255) UNIQUE`, `password_hash VARCHAR(255)`, `phone_number VARCHAR(50)`, `is_verified BOOLEAN DEFAULT false`, `reset_token_hash VARCHAR(64)`, `reset_token_expires_at TIMESTAMPTZ`, timestamps.
- [x] Create necessary database indices:
  - [x] `idx_products_category` on `products(category)`
  - [x] `idx_orders_reference_code` on `orders(reference_code)`
  - [x] `idx_orders_guest_token_hash` on `orders(guest_token_hash)`
  - [x] `idx_customer_accounts_email` on `customer_accounts(email)`
- [x] Write rollback migrations (`down`) verifying clean drop of all tables, types, and constraints.
- [x] Implement database seed script (`seed.ts`):
  - [x] Initial `store_settings` singleton row.
  - [x] Initial seed `staff_users` record (bcrypt-hashed credentials for admin).
  - [x] Sample sembako catalog items across staple categories (`Beras`, `Minyak Goreng`, `Gula Pasir`, `Telur Ayam`, `Tepung Terigu`) with associated inventory records.

---

## 4. Acceptance Criteria
1. **Compilation & Type Safety**:
   - `npm run typecheck` passes across the monorepo with 0 errors.
   - `packages/shared` builds and can be imported directly into `apps/api` and `apps/web`.
   - Strict TypeScript rules are enforced (`noImplicitAny: true`, zero `any` usage).
2. **Lint & Code Hygiene**:
   - `npm run lint` passes with 0 errors and 0 warnings.
   - All files adhere to lowercase kebab-case naming.
3. **Database Integrity**:
   - Running migration up script creates all 9 tables, indexes, and constraints in PostgreSQL without errors.
   - Running rollback down script drops all objects cleanly.
   - Inserting an inventory row with `on_hand < reserved` is rejected by the database engine with `chk_on_hand_ge_reserved` constraint violation.
   - Inserting a second row in `store_settings` is rejected by the `CHECK (id = 1)` constraint.
4. **Seed Validation**:
   - Running `npm run db:seed` inserts store settings, default staff credentials, and initial sembako catalog items idempotently.
5. **Unit Test Coverage**:
   - Unit tests for `formatIdr`, `calculateAvailableStock`, `asIdr`, `sanitizePhoneNumber`, and Zod schemas pass with 100% test success rate.
