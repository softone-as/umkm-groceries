# TICKET-03: Storefront Frontend Core, Design System Tokens, & Catalog Browsing

## 1. Ticket Information
* **Ticket ID**: `TICKET-03`
* **Title**: Storefront Frontend Core, Design System Tokens, & Catalog Browsing
* **Phase**: 3 — Frontend Storefront Foundations & Catalog
* **Estimated Effort**: 3 Days
* **Dependencies**: `TICKET-01`, `TICKET-02`
* **Governing Specifications**:
  * [`SPEC.md`](file:///Users/shofwanasy/projects/santo-groceries/SPEC.md) §1, §2, §3, §5
  * [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §3.1, §4.1
  * [`docs/design.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/design.md) §1, §2, §3, §4
  * [`docs/architecture/tech-stack.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/architecture/tech-stack.md)
  * [`docs/testing/automation-selectors.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/testing/automation-selectors.md)

---

## 2. Objective Description
Scaffold the frontend single-page application in `apps/web` utilizing React 18+, Vite, TanStack Router, TanStack Query, and strict TypeScript. Implement the **"Warung Segar Tetangga"** design system using Vanilla CSS tokens, adhering strictly to the mobile-first 360px viewport gate (zero horizontal overflow) and minimum $\ge 44 \times 44\text{px}$ touch targets. Construct the atomic UI component library and build the responsive, mobile-first public catalog screen featuring real-time category filtering, search input, stock availability badges, and standardized Indonesian Rupiah pricing formatting (`formatIdr`).

---

## 3. Specific Technical Tasks Checklist

### 3.1 Client Framework & Routing Setup
- [ ] Initialize `apps/web` using Vite with React and strict TypeScript template.
- [ ] Install and configure core frontend dependencies:
  - [ ] `@tanstack/react-router`: Configure file-based or code-based routing with root route layout.
  - [ ] `@tanstack/react-query`: Configure `QueryClient` with default stale time (e.g., 60 seconds) and retry policies.
  - [ ] Link `packages/shared` dependency for types, schemas, and utility functions (`formatIdr`).
- [ ] Set up client HTTP API client in `apps/web/src/lib/api-client.ts`:
  - [ ] Base URL pointing to `/api/v1`.
  - [ ] Automatic JSON deserialization and typed error extraction matching `ApiErrorResponse`.

### 3.2 "Warung Segar Tetangga" Design System & CSS Tokens
- [ ] Implement CSS design tokens in `apps/web/src/styles/index.css`:
  - [ ] **Colors**:
    - [ ] Primary Daun Segar Green: `--color-primary: #16a34a`, `--color-primary-hover: #15803d`, `--color-primary-light: #dcfce7`, `--color-on-primary: #ffffff`.
    - [ ] Secondary Warm Amber: `--color-secondary: #f59e0b`, `--color-secondary-hover: #d97706`, `--color-secondary-light: #fef3c7`.
    - [ ] Tertiary Samudra Blue: `--color-tertiary: #0284c7`, `--color-tertiary-light: #e0f2fe`.
    - [ ] Surfaces & Neutrals: `--color-canvas: #f8fafc`, `--color-surface: #ffffff`, `--color-border-subtle: #e2e8f0`.
    - [ ] Text hierarchy: `--color-text-primary: #0f172a`, `--color-text-body: #1e293b`, `--color-text-muted: #64748b`.
    - [ ] Status indicators: `--color-success: #16a34a`, `--color-warning: #f59e0b`, `--color-error: #ba1a1a`, `--color-error-bg: #ffdad6`.
  - [ ] **Typography (Plus Jakarta Sans)**:
    - [ ] Import Google Font *Plus Jakarta Sans* (weights 400, 600, 700, 800).
    - [ ] Define type scale tokens: `display` (32px/800), `headline-lg` (28px/700), `headline-lg-mobile` (22px/700), `headline-md` (20px/700), `headline-sm` (16px/700), `price-lg` (20px/800), `price-md` (16px/800), `body-lg` (16px/400), `body-md` (14px/400), `caption` (12px/600).
  - [ ] **Layout & Responsive Breakpoints**:
    - [ ] Mobile: `< 640px` (4-column grid, 16px padding, 12px gutter).
    - [ ] Tablet: `640px – 1024px` (8-column grid, 24px padding, 16px gutter).
    - [ ] Desktop: `> 1024px` (12-column grid, max centered width `1280px`).
- [ ] Enforce strict mobile-first viewport rules:
  - [ ] CSS reset with `box-sizing: border-box`, `max-width: 100%`, and body `overflow-x: hidden`.
  - [ ] Ensure all pages pass the strict 360px viewport gate with 0px horizontal scroll.
  - [ ] Audit all interactive touch targets to guarantee $\ge 44 \times 44\text{px}$ minimum clickable area.

### 3.3 Core Component Library Construction
- [ ] Implement foundational UI components adhering to kebab-case file naming:
  - [ ] `components/store-header.tsx`:
    - [ ] Displays store brand title ("Santo Groceries"), store address snippet, and operational pickup badge.
  - [ ] `components/search-bar.tsx`:
    - [ ] Text input with search icon, clear button, and debounced callback (300ms).
    - [ ] Includes `data-testid="search-input"`.
  - [ ] `components/category-filter.tsx`:
    - [ ] Horizontally scrollable chip selector on mobile; flex wrap on desktop.
    - [ ] Categories: "Semua", "Beras", "Minyak Goreng", "Gula Pasir", "Telur Ayam", "Tepung Terigu", etc.
    - [ ] Active chip styled with primary green background and bold text.
    - [ ] Includes `data-testid="category-chip"`.
  - [ ] `components/stock-badge.tsx`:
    - [ ] Renders *"Tersedia"* (green badge `#dcfce7` / `#16a34a`) or *"Habis"* (red badge `#ffdad6` / `#ba1a1a`).
  - [ ] `components/product-card.tsx`:
    - [ ] 1:1 aspect ratio image frame with lazy loading and placeholder fallback for missing images.
    - [ ] Clamped 2-line product title with tooltip.
    - [ ] Selling unit display tag (e.g., `per 1 kg`, `isi 10 butir`).
    - [ ] Formatted IDR price using `formatIdr` (e.g., `Rp 72.000`).
    - [ ] Stock availability pill via `StockBadge`.
    - [ ] Primary CTA button: *"Tambah"* (+ icon) with disabled state when out of stock.
    - [ ] Includes `data-testid="product-card"`.
  - [ ] `components/product-grid-skeleton.tsx`:
    - [ ] Animated shimmer loading skeleton matching 2-column mobile and 4-column desktop layout.

### 3.4 Storefront Catalog Route & Data Integration
- [ ] Create catalog query hook `hooks/use-products.ts` leveraging TanStack Query:
  - [ ] Queries `GET /api/v1/products` with active category and search params.
  - [ ] Handles caching, background re-validation, and error states.
- [ ] Implement store settings query hook `hooks/use-store-settings.ts` fetching `GET /api/v1/store-settings`.
- [ ] Assemble Storefront Catalog view `routes/index.tsx` (and `routes/catalog.tsx`):
  - [ ] Header banner with store name, address, and pickup operating hours.
  - [ ] Integrated search bar and category filter bar.
  - [ ] Responsive product grid (2 columns on mobile, 3 columns on tablet, 4 columns on desktop).
  - [ ] Empty search state in Bahasa Indonesia (*"Tidak ada produk yang sesuai dengan pencarian Anda"*).
  - [ ] Error retry banner in Bahasa Indonesia with refresh button.

---

## 4. Acceptance Criteria
1. **360px Viewport Compliance**:
   - Storefront catalog renders on a 360px viewport width with exactly 0px horizontal scroll (`window.innerWidth === document.documentElement.clientWidth`).
2. **Ergonomic Touch Targets**:
   - All interactive controls (category chips, search clear button, card add buttons) measure $\ge 44 \times 44\text{px}$ in computed dimensions.
3. **Design System & Typography Accuracy**:
   - All text renders in *Plus Jakarta Sans*.
   - Color variables strictly match the approved palette tokens (`Daun Segar Green` `#16a34a`, etc.).
   - Currency formatting strictly renders Indonesian Rupiah without decimals (e.g., `Rp 15.000`).
4. **Responsive Layouts**:
   - Mobile (< 640px) renders 2-column product grid with 12px gutter.
   - Desktop (> 1024px) renders 4-column product grid inside 1280px container.
5. **Data Integration & UX States**:
   - Changing category filter updates catalog instantly without full page reload.
   - Typing in search bar triggers debounced filtering.
   - Products with `is_available: false` display red *"Habis"* badge and disabled add button.
   - Loading skeletons display while data is fetching; friendly Indonesian empty state displays when no results match.
6. **Code Quality**:
   - 0 lint errors, 0 TypeScript compile errors.
