# Santo Groceries — Neighborhood Grocery Store

> A web application for online grocery ordering at a local neighborhood store (*toko sembako*). Customers can browse the product catalog, add items to cart, and checkout as a guest or registered account — then coordinate pickup via WhatsApp.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [NPM Commands](#npm-commands)
- [Documentation](#documentation)
- [MVP Scope](#mvp-scope)

---

## Overview

**Santo Groceries** is a full-stack monorepo web application built for a neighborhood grocery store. It enables low-latency digital ordering of everyday pantry staples, covering two primary domains:

- **Storefront (Customer Domain)**: A mobile-first web interface in Bahasa Indonesia — digital product catalog, shopping cart, guest & registered checkout workflows, in-store pickup, and WhatsApp handoff for post-order coordination.
- **Back-Office / Operations Dashboard (Staff Domain)**: An authenticated management interface for real-time inventory adjustments, payment verification, order fulfillment lifecycle processing, and order cancellations.

---

## Features

### Storefront (Customer-Facing)

- **Digital Catalog**: Browse active products with real-time available stock (`Available = On-Hand - Reserved`), category filtering, and product search
- **Shopping Cart**: Add/remove items, modify quantities, and view dynamic subtotals
- **Flexible Checkout**:
  - *Guest Checkout*: Order with just a name & WhatsApp number — no account required
  - *Registered Checkout*: Create an account & sign in to access order history
  - Claim past guest orders into an authenticated account using a secret token
- **Payment Methods**: Bank Transfer or Pay at Store
- **Fulfillment**: In-store physical pickup (*Ambil di Toko*)
- **WhatsApp Handoff**: Prefilled click-to-chat links for customer-initiated coordination with the store

### Operations Dashboard (Staff-Facing)

- **Catalog Management**: Create, edit, and deactivate products with image uploads
- **Inventory Management**: Manual stock adjustments with mandatory reason logs (*restock*, *damage*, *offline sale*)
- **Order Queue**: Filter by status, manual payment confirmation, preparation tracking, and pickup recording
- **Order Cancellation**: With documented reasons and atomic reservation release
- **Store Settings**: Shop profile, address, pickup hours, official WhatsApp number, and bank account details

---

## Architecture

```
Browser (Mobile 360px / Desktop 1280px)
    |
    +-- React + Vite Frontend
    |       +-- TanStack Router  (type-safe routing)
    |       +-- TanStack Query   (server state & caching)
    |
    |   HTTPS JSON REST
    |
    +-- Express.js API Server
    |       +-- Input Validation  (Zod schemas)
    |       +-- Auth & Session Guard
    |       +-- Transaction & Inventory Service
    |
    +-- PostgreSQL Database
            +-- Product catalog & categories
            +-- Inventory balances (on_hand, reserved)
            +-- Orders & line item snapshots
            +-- Audit logs & staff credentials
```

**Core Architectural Principles:**

- **Unified Order Path**: Guest and registered customers share the identical order processing pipeline
- **ACID Transactions**: All inventory mutations use `SELECT ... FOR UPDATE` with ascending `product_id` ordering to prevent deadlocks
- **Idempotency**: Checkout retries using the same idempotency key return the existing order — no duplicate stock reservations
- **Decoupled External Handoff**: WhatsApp is opened by the client browser via `wa.me/` URLs; the server has zero dependency on external webhooks or delivery acknowledgments

---

## Tech Stack

| Layer | Technology | Notes |
|:---|:---|:---|
| **Frontend Framework** | React 18 + Vite 5 | Instant HMR, lightweight SPA architecture |
| **Client Routing** | TanStack Router v1 | Type-safe URL routing & search param validation |
| **Server State** | TanStack Query v5 | Declarative caching, background refetching |
| **Styling** | Tailwind CSS v4 | CSS-first config, zero-runtime utility classes, design token integration |
| **Backend** | Express.js v5 | Mature, lightweight Node.js HTTP framework |
| **Type Safety** | TypeScript 5.4+ (strict) | End-to-end; zero `any` policy |
| **Database** | PostgreSQL 15+ | ACID compliance, row-level locking, inventory constraints |
| **Schema Validation** | Zod v3 | Shared schemas in `packages/shared` |
| **Cryptography** | Bcrypt / Argon2 | Staff & customer credential hashing |
| **Image Storage** | Local Disk + Adapter Interface | `/uploads/images`, ready for zero-code migration to Cloudflare R2 / S3 |
| **Language & Locale** | Bahasa Indonesia (`id-ID`) | All UI copy, errors, and currency formatting (`Rp`) |

---

## Monorepo Structure

```
santo-groceries/
├── apps/
│   ├── web/                  # Frontend SPA (React + Vite)
│   │   └── src/
│   │       ├── components/   # product-card.tsx, cart-drawer.tsx, ...
│   │       ├── routes/       # catalog.tsx, checkout.tsx, ...
│   │       └── hooks/        # use-cart.ts, use-order-status.ts
│   └── api/                  # Backend REST API (Express.js + TypeScript)
│       └── src/
│           ├── modules/
│           │   ├── products/
│           │   ├── orders/
│           │   └── inventory/
│           └── db/           # Database migrations & seed scripts
├── packages/
│   └── shared/               # Shared domain types, Zod schemas, & utilities
│       └── src/
│           ├── types/        # order-types.ts, product-types.ts
│           └── utils/        # format-idr.ts, calculate-stock.ts
├── docs/                     # Architecture, product, design, & testing specs
│   ├── PRD.md
│   ├── design.md
│   ├── architecture/
│   ├── adr/
│   ├── api/
│   └── testing/
├── tickets/                  # Feature implementation tickets
├── SPEC.md                   # Formal technical specification
├── package.json              # Root workspace manifest
├── pnpm-workspace.yaml
└── tsconfig.base.json        # Strict TypeScript base configuration
```

---

## Prerequisites

- **Node.js** v20+ (LTS)
- **npm** or **pnpm**
- **PostgreSQL** v15+

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repository-url> santo-groceries
cd santo-groceries
npm install
# or
pnpm install
```

### 2. Configure Environment

Create a `.env` file in `apps/api/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/santo_groceries
SESSION_SECRET=your-secret-key-min-32-chars
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

### 3. Set Up the Database

```bash
# Run migrations
npm run db:migrate

# (Optional) Seed initial data
npm run db:seed
```

### 4. Start Development Servers

```bash
# Frontend — http://localhost:5173
npm run dev --workspace=@santo/web

# Backend — http://localhost:3000
npm run dev --workspace=@santo/api
```

Set `CORS_ORIGINS` to a comma-separated allowlist of storefront origins in each deployment environment.

### Run with Docker

Requirements: Docker with the Compose plugin.

```bash
cp .env.docker.example .env
# Replace SESSION_SECRET with a random value of at least 32 characters.
docker compose up --build
```

Open the storefront at [http://localhost:8080](http://localhost:8080). The API runs behind the web server, and database migrations run automatically when the API starts. PostgreSQL data and uploaded images are stored in named Docker volumes.

To seed the database after startup:

```bash
docker compose exec api node apps/api/dist/db/seed.js
```

Stop the services with `docker compose down`. To also delete the database and uploaded images, use `docker compose down --volumes`.

---

## NPM Commands

Run from the monorepo root:

| Command | Description |
|:---|:---|
| `npm run build` | Build all workspaces |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) across all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run all tests |
| `npm run db:migrate` | Run database migrations (up) |
| `npm run db:migrate:down` | Roll back database migrations |
| `npm run db:seed` | Seed initial data into the database |

**CI Quality Gates** — all must pass before merging:

- `npm run lint` → 0 errors, 0 warnings
- `npm run typecheck` → 0 type errors
- `npm run test` → 100% passing

---

## Documentation

| Document | Description |
|:---|:---|
| [`SPEC.md`](./SPEC.md) | Formal technical specification & engineering standards |
| [`docs/PRD.md`](./docs/PRD.md) | Product Requirements Document |
| [`docs/design.md`](./docs/design.md) | Design system & screen specifications |
| [`docs/architecture/overview.md`](./docs/architecture/overview.md) | System architecture overview |
| [`docs/architecture/tech-stack.md`](./docs/architecture/tech-stack.md) | Tech stack & tooling details |
| [`docs/architecture/data-model.md`](./docs/architecture/data-model.md) | Database schema & data model |
| [`docs/architecture/conventions.md`](./docs/architecture/conventions.md) | Code & engineering conventions |
| [`docs/adr/`](./docs/adr/) | Architecture Decision Records |
| [`docs/governance.md`](./docs/governance.md) | Documentation governance |

---

## MVP Scope

### In Scope

- Digital catalog & inventory management
- Shopping cart & checkout (guest + registered)
- Bank Transfer & Pay at Store payment methods
- In-store pickup fulfillment
- WhatsApp handoff for order coordination
- Staff dashboard (catalog, stock, orders, store settings)

### Out of Scope (MVP)

- Delivery services, shipping fees, or courier integrations
- Automated payment gateways (Midtrans, Xendit, QRIS, card payments)
- WhatsApp Business API, automated notifications, or chatbots
- In-app bank transfer proof uploads
- Automatic stock reservation expiry
- Multi-store or multi-branch operations
- Loyalty points, discounts, or subscriptions

---

> **Note**: All customer and staff-facing UI is in Bahasa Indonesia (`id-ID`). All monetary values are stored and computed as integer Indonesian Rupiah (`Rp`) — no floating-point currency arithmetic.
