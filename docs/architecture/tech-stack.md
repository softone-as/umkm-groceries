# Technology Stack & Tooling

Status: Approved Technical Directions & Open Infrastructure Choices  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §4, §5  
Last Updated: 2026-10-09  

---

## 1. Approved Technical Stack

The following components are approved per the PRD specification:

| Layer / Concern | Approved Technology | Rationale & PRD Directives |
| :--- | :--- | :--- |
| **Frontend Framework** | **React** with **Vite** | Modern, fast build times, component ecosystem, responsive single-page architecture. |
| **Client Routing** | **TanStack Router** | Type-safe URL routing, search params validation, clean nested routes. |
| **Server State Management** | **TanStack Query** | Declarative caching, background refetching, mutation lifecycle hooks. |
| **Frontend Styling** | **Tailwind CSS v4** | CSS-first utility framework with `@theme` design token integration; no JavaScript runtime, works natively with Vite 5 via the `@tailwindcss/vite` plugin. |
| **Backend Framework** | **Express.js** | Lightweight, mature Node.js HTTP framework with robust middleware ecosystem. |
| **Type Safety** | **Strict TypeScript** | Enforced on both frontend and backend; `noImplicitAny: true`, strict null checks. |
| **Database** | **PostgreSQL** | Relational ACID guarantees, row-level locking (`FOR UPDATE`), strong constraint support for inventory. |
| **Language & Locale** | **Bahasa Indonesia** | All user-facing storefront and dashboard copy in natural Indonesian; integer IDR formatting (`Rp`). |

---

## 2. Infrastructure & Storage Decisions (Per ADR 0006)

| Component | Status | Approved Strategy | Technical Specification |
| :--- | :--- | :--- | :--- |
| **Product Image Storage** | **Approved** | Local disk with Modular Adapter | Express static route (`/uploads/images`), parsed via `multipart/form-data`, abstracted behind `ImageStorageService` for zero-code migration to Cloudflare R2 / S3. |
| **Customer Authentication** | **Approved** | Email & Password | Bcrypt/Argon2 hashing, email verification, password reset tokens, zero SMS/WhatsApp API fees. |
| **Codebase Architecture** | **Approved** | Monorepo Workspaces | npm / pnpm workspaces: `apps/web` (React/Vite), `apps/api` (Express/TS), `packages/shared` (types/schemas). |
| **Application Hosting** | **TBD** | Single VPS (DigitalOcean / Hetzner) or PaaS (Render / Railway) | Evaluated based on hosting budget and reverse proxy simplicity. |
| **Database Hosting** | **TBD** | Managed PostgreSQL (Neon / Supabase) vs Colocated Postgres | Data durability, automated backup capabilities. |
| **Database Backup Storage** | **TBD** | Automated daily pg_dump to offsite S3/R2 with test restoration before launch | RTO and RPO targets vs budget. |

---

## 3. Tooling & Workspace Structure

* **Monorepo Workspaces**:
  * `apps/web/`: React + Vite + TanStack Router + TanStack Query + **Tailwind CSS v4**
  * `apps/api/`: Express.js + PostgreSQL + Strict TypeScript REST API
  * `packages/shared/`: Shared TypeScript domain types, validation schemas (Zod), and API contracts
* **Node.js Runtime**: Modern LTS (v20+ recommended).
* **Package Management**: npm / pnpm workspaces.
* **No AI Dependencies**: No AI/LLM models, prompt pipelines, or AI tool calls in the MVP runtime.
