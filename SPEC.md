# Formal Technical Specification (SPEC.md)
## Toko Sembako Web Application — Santo Groceries

* **Status**: Authoritative Technical Specification
* **Version**: 1.0.0
* **Date**: October 10, 2026
* **Reference Documents**:
  * Product Requirements Document: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md)
  * Design System & Screen Specifications: [`docs/design.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/design.md)
  * Data Model & Schema Specification: [`docs/architecture/data-model.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/data-model.md)
  * Engineering Conventions: [`docs/architecture/conventions.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/conventions.md)
  * Technology Stack & Tooling: [`docs/architecture/tech-stack.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/tech-stack.md)
  * Architectural Decision Records: [`docs/adr/`](file:///Users/shofwanasy/projects/santo-groceries/docs/adr/)

---

## 1. System Overview & Architecture

**Santo Groceries** is a monorepo web application tailored for a neighborhood grocery store (*toko sembako*). The system is engineered for resilient, transparent, and low-latency digital ordering of everyday pantry staples. It encompasses two primary domains:
1. **Storefront (Customer Domain)**: A responsive, mobile-first web interface in Bahasa Indonesia providing a digital catalog, shopping cart, guest and registered checkout workflows, in-store pickup fulfillment, and seamless click-to-chat WhatsApp handoff for post-order coordination.
2. **Back-Office / Operations Dashboard (Staff Domain)**: An authenticated management interface enabling real-time inventory adjustments, payment verification, order fulfillment lifecycle processing, and order cancellations.

### 1.1 Monorepo Workspace Structure
The codebase uses npm/pnpm workspaces with strict modular boundaries:

```
santo-groceries/
├── apps/
│   ├── web/                     # Frontend client application (React + Vite SPA)
│   └── api/                     # Backend REST API service (Express.js + TypeScript)
├── packages/
│   └── shared/                  # Shared domain types, Zod schemas, constants, & utility functions
├── docs/                        # Architecture, product, design, and testing specifications
├── SPEC.md                      # Formal technical specification
├── package.json                 # Root monorepo workspace manifest
└── tsconfig.base.json           # Base strict TypeScript compiler configuration
```

---

## 2. Technology Stack & Infrastructure

The technical stack is selected to prioritize strict ACID transactional integrity, low operational overhead, rapid build times, and end-to-end type safety:

| Layer / Concern | Chosen Technology | Version / Standard | Rationale & Technical Justification |
| :--- | :--- | :--- | :--- |
| **Monorepo Manager** | npm / pnpm workspaces | Node.js LTS (v20+) | Unified dependency management, isolated packages, and single-command linting/builds. |
| **Frontend Framework** | **React** + **Vite** | React 18+, Vite 5+ | Instant HMR build times, rich component ecosystem, and lightweight SPA architecture. |
| **Client Routing** | **TanStack Router** | v1+ | Full type-safe URL routing, first-class search param validation, and clean nested route layouts. |
| **Client Server State** | **TanStack Query** | v5+ | Declarative server-state caching, automatic background refetching, optimistic updates, and query deduplication. |
| **Styling & Design System** | **Vanilla CSS** + CSS Tokens | Modern CSS (CSS Variables) | High flexibility without heavy third-party framework overhead; optimal rendering performance and zero runtime bloat. |
| **Backend Framework** | **Express.js** | v4+ | Battle-tested, lightweight Node.js HTTP framework with a robust middleware ecosystem. |
| **Type Safety** | **Strict TypeScript** | TypeScript 5.4+ | Enforced across `apps/web`, `apps/api`, and `packages/shared` for zero client-server contract drift. |
| **Relational Database** | **PostgreSQL** | v15+ | Strict ACID compliance, row-level locking (`SELECT ... FOR UPDATE`), and database-level check constraints for inventory guarantees. |
| **Schema Validation** | **Zod** | v3+ | Shared declarative schemas in `packages/shared` providing runtime validation for API inputs and client forms. |
| **Media & Image Storage** | Local Disk Storage + Modular Adapter | `multipart/form-data` | Stored locally in `/uploads/images` behind an `ImageStorageService` interface, allowing zero-code migration to Cloudflare R2 / S3. |
| **Cryptography & Hashing**| Bcrypt / Argon2 + Node Crypto | SHA-256 (Guest Token) | Secure credential hashing for staff/customers and 128-bit SHA-256 hashed secret guest access tokens. |
| **Language & Locale** | Bahasa Indonesia (`id-ID`) | National Standard | All user-facing UI text, validation errors, and currency formatting adhere to natural Indonesian conventions (`Rp`). |

---

## 3. UI/UX Design Rules: Mobile-First, Minimalist, & Responsive

The design implements the **"Warung Segar Tetangga"** design system, combining modern digital utility with the warmth and trust of neighborhood grocery retail.

### 3.1 Mobile-First Engineering Rules
1. **Strict 360px Viewport Gate**: All customer-facing screens must render seamlessly on a 360px viewport width with **0px horizontal scroll** (*zero horizontal overflow*).
2. **Touch Target Dimensions**: All interactive elements (buttons, inputs, quantity steppers, chips, navigation tabs) must adhere to a minimum touch target size of **$\ge 44 \times 44\text{px}$** for ergonomic one-handed thumb interaction.
3. **Floating Mobile Cart Dock**: On mobile screens, an accessible floating bar is pinned above the device home indicator, displaying item count, formatted Rupiah grand total, and a primary CTA button (*"Lihat Keranjang"* or *"Beli Sekarang"*).

### 3.2 Minimalist Aesthetics & Visual Foundations
1. **High-Contrast Light Foundation**: Interfaces use a clean, high-contrast light palette ($> 14:1$ contrast ratio, exceeding WCAG AAA standards) ensuring legibility under bright outdoor sunlight.
2. **Design Tokens & Color Palette**:
   * **Primary Brand**: *Daun Segar Green* (`--color-primary: #16a34a`, hover `#15803d`, light `#dcfce7`).
   * **Secondary Accent**: *Minyak & Beras Warm Amber* (`--color-secondary: #f59e0b`, light `#fef3c7`).
   * **Tertiary / Utility**: *Samudra Blue* (`--color-tertiary: #0284c7`, light `#e0f2fe`).
   * **Surfaces**: Canvas `#f8fafc`, Surface `#ffffff`, Border `#e2e8f0`.
   * **Typography Colors**: Primary `#0f172a`, Body `#1e293b`, Muted `#64748b`.
   * **Status Badges**: Success `#16a34a`, Warning `#f59e0b`, Error `#ba1a1a` (Background `#ffdad6`).
3. **Consistent Typography Scale (Plus Jakarta Sans)**:
   * **Plus Jakarta Sans** is the sole font family across all display, body, and microcopy surfaces, guaranteeing clear legibility of currency figures and units.
   * Typographic hierarchy: Display (32px/800), Headline Desktop (28px/700), Headline Mobile (22px/700), Section Header (20px/700), Card Title (16px/700), Price (16px–20px/800), Body (14px–16px/400), Badges/Labels (10px–14px/600–700).

### 3.3 Responsive Grid & Layout Breakdown
* **Mobile (< 640px)**: 4-column layout, 16px outer margin, 12px gutter; dense 2-column product card grid; single-column linear checkout flow.
* **Tablet (640px – 1024px)**: 8-column layout, 24px outer margin, 16px gutter; 3-column product card grid.
* **Desktop (> 1024px)**: 12-column layout, max centered width **1280px**; 4-column product grid; 2-column checkout layout (form on left, sticky order summary card on right); data-dense operational tables for staff.

### 3.4 Core Component Standards
1. **Product Card**: 1:1 square image frame with placeholder fallback, stock status pill (*Tersedia* / *Habis*), 2-line clamped title, selling unit indicator (`per 1 kg`, `isi 10 butir`), bold IDR price, and quick-add button.
2. **Quantity Stepper**: Circular buttons with touch targets $\ge 32\text{px}$. Decrementing from quantity 1 transitions the button into a red trash icon for intuitive deletion.
3. **Payment Method Selector**: Radio cards for **Transfer Bank** and **Bayar di Toko**. Selected state is indicated by a 2px green border (`#16a34a`) and light green background tint (`#f0fdf4`).
4. **Order Status Timeline**: Stepper component presenting linear lifecycle state: `Diajukan` $\rightarrow$ `Diterima` $\rightarrow$ `Disiapkan` $\rightarrow$ `Siap Diambil` $\rightarrow$ `Selesai`.

---

## 4. MVP Scope & Boundaries (Minimum Viable Product)

To guarantee operational stability, rapid deployment, and store owner alignment, the MVP scope is strictly constrained.

### 4.1 In-Scope Capabilities
1. **Digital Catalog & Inventory**: Active product browsing, real-time available stock calculation (`Available = On-Hand - Reserved`), category filtering, and product search.
2. **Shopping Cart**: Item addition/removal, positive integer quantity modification, dynamic subtotal calculation, and pre-checkout availability verification.
3. **Flexible Checkout Modes**:
   * *Guest Checkout*: Streamlined ordering with Name and WhatsApp number; order status tracked via a secure non-enumerable secret link (`/orders/guest?token=...`).
   * *Registered Checkout*: Account creation and login with Email and Password; view historical and current orders.
   * Claim guest orders into an authenticated account using the secret guest token.
4. **Payment Options**: Manual Bank Transfer (`bank_transfer`) and In-Store Payment (`pay_at_store`).
5. **Fulfillment**: In-Store Physical Pickup (*Ambil di Toko*).
6. **WhatsApp Communication Handoff**: Preformatted `https://wa.me/` click-to-chat links for customer-initiated store coordination.
7. **Authenticated Staff Operations Dashboard**:
   * Catalog management (create, edit, deactivate products).
   * Manual inventory adjustments with mandatory reason logs (*restock*, *damage*, *offline sale*).
   * Order queue with state filtering, manual payment confirmation, preparation tracking, and collection recording.
   * Order cancellation with documented reason categorizing inventory discrepancies.
   * Store settings management (shop profile, physical address, pickup hours, official WhatsApp number, bank account details).

### 4.2 Explicit Non-Goals (Out of MVP Scope)
The following features are **strictly excluded** from the MVP:
1. **Delivery Services**: No shipping fees, radius checks, or courier integrations (Grab, Gojek, Lalamove).
2. **Multi-Store / Multi-Branch**: Single physical store only; no multi-warehouse or marketplace logic.
3. **Automated Payment Gateways**: No automated bank scraping, credit card processors, dynamic QRIS APIs, or virtual accounts (Midtrans, Xendit).
4. **WhatsApp Business API**: No outbound messaging APIs, webhooks, or automated bots.
5. **In-App Payment Proof Upload**: No image uploads or storage for bank transfer receipts; proof is shared directly over WhatsApp chat.
6. **Automatic Stock Reservation Expiration**: No automated cron jobs releasing reserved stock; staff manually review and cancel abandoned orders.
7. **Hardware / POS Integration**: No barcode scanners, receipt printers, or external POS register sync.
8. **Fractional / Weight Ordering**: No decimal weights (e.g., 0.75 kg); orders are strictly positive integer multiples of the declared selling unit.
9. **Floating-Point Currency**: No decimal fractions for currency arithmetic; all monetary values are stored and calculated as integer Indonesian Rupiah (`BIGINT`).
10. **Runtime AI Dependencies**: No generative AI models, LLM prompts, or AI runtime agents in production customer or staff workflows.

---

## 5. Engineering Standards & Code Conventions

### 5.1 File & Directory Naming (Strict kebab-case)
All files and directories across `apps/`, `packages/`, and `docs/` must strictly use lowercase **kebab-case**. PascalCase or camelCase file naming is prohibited:

```
# Frontend (apps/web/src/)
components/
├── cart-drawer.tsx
├── product-card.tsx
├── payment-method-selector.tsx
├── quantity-stepper.tsx
└── order-status-timeline.tsx
routes/
├── index.tsx
├── catalog.tsx
├── checkout.tsx
└── order-confirmation.tsx
hooks/
├── use-cart.ts
└── use-order-status.ts

# Backend (apps/api/src/)
modules/
├── orders/
│   ├── order-controller.ts
│   ├── order-service.ts
│   ├── order-repository.ts
│   └── order-routes.ts
├── inventory/
│   ├── inventory-service.ts
│   └── inventory-repository.ts
└── products/
    └── product-controller.ts

# Shared Packages (packages/shared/src/)
utils/
├── format-idr.ts
├── calculate-stock.ts
└── sanitize-phone.ts
types/
├── order-types.ts
└── product-types.ts
```

### 5.2 TypeScript Strictness & Explicit Utility Function Types
1. **Compiler Strictness Configuration**:
   * `"strict": true`, `"noImplicitAny": true`, `"noUncheckedIndexedAccess": true`, and `"exactOptionalPropertyTypes": true`.
   * **Zero `any` Policy**: The `any` keyword is disallowed. Use `unknown` with type guards or Zod validation schemas when handling untyped payloads.
2. **Explicit Utility Typing**:
   Every utility function must define unambiguous parameter types and explicit return types with JSDoc documentation.
   * *Example 1: Indonesian Rupiah Currency Formatter*:
     ```typescript
     /**
      * Formats an integer amount into standardized Indonesian Rupiah currency string.
      * @param amount Integer Rupiah value (no decimals).
      * @returns Formatted currency string, e.g., "Rp 15.000".
      */
     export function formatIdr(amount: number): string {
       return new Intl.NumberFormat('id-ID', {
         style: 'currency',
         currency: 'IDR',
         maximumFractionDigits: 0,
       }).format(amount);
     }
     ```
   * *Example 2: Available Stock Calculation*:
     ```typescript
     export interface StockBalance {
       readonly onHand: number;
       readonly reserved: number;
     }

     /**
      * Calculates available stock ready for customer purchase.
      * @param balance Object containing physical onHand and active reserved quantities.
      * @returns Non-negative available quantity.
      */
     export function calculateAvailableStock(balance: StockBalance): number {
       const available = balance.onHand - balance.reserved;
       return Math.max(0, available);
     }
     ```
   * *Example 3: Branded Type for Monetary Safety*:
     ```typescript
     export type IdrAmount = number & { readonly __brand: unique symbol };

     export function asIdr(value: number): IdrAmount {
       if (!Number.isInteger(value) || value < 0) {
         throw new TypeError(`IDR amount must be a non-negative integer: ${value}`);
       }
       return value as IdrAmount;
     }
     ```

### 5.3 Code Quality & Zero Lint Errors
1. **Linter & Formatter Rules**: All code is validated using ESLint and Prettier (or Biome) with strict TypeScript rules.
2. **CI Quality Gates**:
   * `npm run lint` $\rightarrow$ 0 errors, 0 warnings.
   * `npm run typecheck` (`tsc --noEmit`) $\rightarrow$ 0 type errors.
   * `npm run test` $\rightarrow$ 100% passing unit & integration tests.
3. **Standard API Response Contracts**:
   All HTTP endpoints return standardized JSON envelopes:
   ```typescript
   // Standard Success Envelope
   export interface ApiSuccessResponse<T> {
     readonly success: true;
     readonly data: T;
     readonly meta?: Record<string, unknown>;
   }

   // Standard Error Envelope (HTTP 4xx / 5xx)
   export interface ApiErrorResponse {
     readonly success: false;
     readonly error: {
       readonly code: string;       // UPPER_SNAKE_CASE (e.g., INSUFFICIENT_STOCK)
       readonly message: string;    // Human-readable message in Bahasa Indonesia
       readonly details?: unknown;  // Optional field validation details
     };
   }
   ```
4. **Standardized Error Codes**:
   * `INSUFFICIENT_STOCK` (`422`): Requested quantity exceeds available inventory.
   * `PRICE_CHANGED` (`409`): Catalog price changed after cart was opened.
   * `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` (`409`): Idempotency key reused with mismatched item payload.
   * `INVALID_STATE_TRANSITION` (`422`): Illegal lifecycle mutation.
   * `UNAUTHORIZED` (`401`): Missing or invalid authentication token.
   * `FORBIDDEN` (`403`): Access to another customer's order denied.
   * `NOT_FOUND` (`404`): Target entity does not exist.

### 5.4 Privacy, Logging, & Concurrency Integrity
1. **Logging Hygiene & Zero Credential Leakage**:
   * Secret guest access tokens, password hashes, and session cookies must be scrubbed from all server logs.
   * WhatsApp phone numbers must be masked in log streams (e.g., `+62812****7890`).
2. **Concurrency & Database Row Locks**:
   * Inventory mutations at checkout must execute inside a database transaction using `SELECT ... FOR UPDATE` with ascending `product_id` ordering to prevent deadlocks.
   * The database constraint `CHECK (on_hand >= reserved)` prevents negative inventory states under concurrent requests.
