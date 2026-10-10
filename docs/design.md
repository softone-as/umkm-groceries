# UI/UX Design System & Screen Specifications

Status: Authoritative Design Specification  
Source Reference: Google Stitch Project [`4873199083941307327`](https://stitch.withgoogle.com/projects/4873199083941307327?pli=1) (*Toko Sembako Web App*)  
Theme Name: **Warung Segar Tetangga**  
Authoritative Product Constraints: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md)  
Last Updated: 2026-10-09  

---

## 1. Brand Identity & Design Philosophy

The design system bridges modern digital commerce with the dependable, grounded warmth of traditional Indonesian neighborhood grocery shopping (*belanja warung sembako*).

### 1.1 Brand Personality & Tone
* **Amanah & Bersahabat (Trustworthy & Neighborly)**: Interfaces are welcoming, transparent, and unpretentious, instilling confidence in everyday staple pricing, product freshness, and fulfillment.
* **Segar & Higienis (Fresh & Wholesome)**: Visuals highlight pantry staples (rice, cooking oil, eggs, flour, spices) through crisp, high-contrast surfaces without sensory clutter.
* **Praktis & Aksesibel (Everyday Simplicity)**: Engineered specifically for diverse demographics across urban and semi-urban Indonesia—from busy homemakers to warung operators—prioritizing clarity under outdoor sunlight and effortless one-handed thumb navigation.

### 1.2 Core Visual Style
* Balances **Modern Utility** with **Warm Tactile Retail**.
* Surfaces are airy with soft radii, organic botanical green accents, gentle warm amber highlight badges, and subtle tonal borders rather than heavy skeuomorphism or artificial neon hues.

---

## 2. Design Tokens

### 2.1 Color Palette

The system operates strictly with a high-contrast `light` foundation to ensure readability outdoors and under bright ambient conditions.

```css
:root {
  /* Primary Brand (Daun Segar Green) */
  --color-primary: #16a34a;
  --color-primary-container: #00873a;
  --color-primary-hover: #15803d;
  --color-primary-light: #dcfce7;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #f7fff2;

  /* Secondary (Minyak & Beras Warm Amber) */
  --color-secondary: #f59e0b;
  --color-secondary-container: #fea619;
  --color-secondary-hover: #d97706;
  --color-secondary-light: #fef3c7;
  --color-on-secondary: #ffffff;
  --color-on-secondary-container: #684000;

  /* Tertiary (Samudra Blue - Transactional & Utility) */
  --color-tertiary: #0284c7;
  --color-tertiary-container: #007bb9;
  --color-tertiary-light: #e0f2fe;
  --color-on-tertiary: #ffffff;

  /* Neutrals & Surfaces */
  --color-canvas: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-dim: #cfdaf2;
  --color-surface-container-low: #f0f3ff;
  --color-surface-container: #e7eeff;
  --color-surface-container-high: #dee8ff;

  /* Text & Typography */
  --color-text-primary: #0f172a;
  --color-text-body: #1e293b;
  --color-text-muted: #64748b;
  --color-text-subtle: #94a3b8;

  /* Borders & Dividers */
  --color-border-subtle: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-outline: #6e7b6c;

  /* Status & Alerts */
  --color-success: #16a34a;
  --color-success-bg: #dcfce7;
  --color-warning: #f59e0b;
  --color-warning-bg: #fef3c7;
  --color-error: #ba1a1a;
  --color-error-bg: #ffdad6;
  --color-error-text: #93000a;
}
```

### 2.2 Typography Scale (Plus Jakarta Sans)

**Plus Jakarta Sans** is used universally across display, body, and microcopy. Its generous aperture, geometric balance, and clean numerals guarantee immediate legibility for currency symbols (`Rp`) and metric units (`kg`, `liter`, `pcs`, `ikat`).

| Token | Font Family | Size | Weight | Line Height | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display` | Plus Jakarta Sans | 32px | 800 (ExtraBold) | 40px | Hero headlines, landing banners |
| `headline-lg` | Plus Jakarta Sans | 28px | 700 (Bold) | 36px | Page titles (Desktop) |
| `headline-lg-mobile` | Plus Jakarta Sans | 22px | 700 (Bold) | 28px | Page titles (Mobile) |
| `headline-md` | Plus Jakarta Sans | 20px | 700 (Bold) | 26px | Section headers, modal titles |
| `headline-sm` | Plus Jakarta Sans | 16px | 700 (Bold) | 22px | Product card titles, subheadings |
| `price-lg` | Plus Jakarta Sans | 20px | 800 (ExtraBold) | 26px | Cart grand total, checkout sum |
| `price-md` | Plus Jakarta Sans | 16px | 800 (ExtraBold) | 22px | Product card price, line items |
| `body-lg` | Plus Jakarta Sans | 16px | 400 (Regular) | 24px | Lead paragraphs, instructions |
| `body-md` | Plus Jakarta Sans | 14px | 400 (Regular) | 20px | Standard body text, descriptions |
| `body-sm` | Plus Jakarta Sans | 12px | 400 (Regular) | 16px | Selling units (`per 1 kg`), footnotes |
| `label-md` | Plus Jakarta Sans | 14px | 600 (SemiBold) | 18px | Primary button labels |
| `label-sm` | Plus Jakarta Sans | 12px | 600 (SemiBold) | 16px | Secondary buttons, tabs, chips |
| `label-xs` | Plus Jakarta Sans | 10px | 700 (Bold) | 14px | Status badges (*Tersedia*, *Habis*) |

> [!IMPORTANT]
> **Currency Invariant Rule**: Per the PRD, prices are always formatted in whole Indonesian Rupiah with explicit thousand separators and zero decimals (e.g., `Rp 15.000`, `Rp 72.000`). Strikethrough comparative prices use `body-sm` in `--color-text-subtle`.

### 2.3 Border Radii (`rounded`)
* `rounded-sm`: `0.25rem` (4px) — Small tags, micro badges.
* `rounded-default`: `0.5rem` (8px) — Input fields, select dropdowns, alert boxes.
* `rounded-md`: `0.75rem` (12px) — Primary action buttons, category filter chips.
* `rounded-lg`: `1rem` (16px) — Product cards, promotional cards, summary modules.
* `rounded-xl`: `1.5rem` (24px) — Modal sheets, floating bottom cart dock (top corners).
* `rounded-full`: `9999px` — Quantity stepper circular buttons, status pills.

### 2.4 Spacing & Grid System
* **Spacing Scale**:
  * `space-xs`: `0.25rem` (4px)
  * `space-sm`: `0.5rem` (8px)
  * `space-md`: `0.75rem` (12px)
  * `space-lg`: `1rem` (16px)
  * `space-xl`: `1.5rem` (24px)
  * `space-2xl`: `2rem` (32px)
* **Breakpoints & Layout**:
  * **Mobile (< 640px)**: 4-column layout; gutter `12px` (`0.75rem`), edge margins `16px` (`1rem`). Dense 2-column product card grid. Touch targets strictly $\ge 44\text{px}$.
  * **Tablet (640px – 1024px)**: 8-column layout; gutter `16px`, margins `24px`. 3-column product grid.
  * **Desktop (> 1024px)**: 12-column layout; max width `1280px` centered; 4-column product grid with sticky cart summary column.

### 2.5 Elevation & Depth Scale
* **Level 0 (Canvas Ground)**: Background `#F8FAFC`. Completely flat.
* **Level 1 (Cards & Modules)**: Pure white `#FFFFFF` surface with `1px solid #E2E8F0` and `box-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.04)`.
* **Level 2 (Interactive Floating / Steppers / Dropdowns)**: `#FFFFFF` with `box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.07)`.
* **Level 3 (Sticky Bottom Cart Dock & Modals)**: Fixed dock with `box-shadow: 0 -4px 18px 0 rgba(15, 23, 42, 0.06)` and top border `1px solid #E2E8F0`.

---

## 3. Component Design Standards

### 3.1 Buttons
* **Primary Button** (*"+ Keranjang"*, *"Lanjut ke Pembayaran"*, *"Konfirmasi"*):
  * Background: `--color-primary` (`#16A34A`), text `#FFFFFF`, font `label-md`.
  * Height: 48px on mobile for easy thumb reach, 44px on desktop.
  * Hover: transitions to `--color-primary-hover` (`#15803D`).
  * Radius: `rounded-md` (12px).
* **Secondary Button** (*"Lihat Detail"*, *"Kembali"*):
  * Background: `--color-primary-light` (`#DCFCE7`), text `--color-primary`, border `1px solid #BBF7D0`.
* **Danger Button** (*"Batalkan Pesanan"*):
  * Background: `--color-error` (`#BA1A1A`), text `#FFFFFF`. Disabled if order is `collected`.

### 3.2 Product Card
* Container: `#FFFFFF`, `1px solid #E2E8F0`, `rounded-lg` (16px).
* Image Frame: Fixed 1:1 square ratio at the top with subtle background `#F1F5F9`.
* Badges:
  * *Tersedia* (In Stock): Top-left badge, background `#DCFCE7`, text `#16A34A`, `label-xs`.
  * *Habis* (Out of Stock): Top-left badge, background `#F1F5F9`, text `#64748B`, `label-xs`.
  * *Promo / Diskon*: Top-right badge, background `#FEF3C7`, text `#D97706`.
* Details: Product name clamped to 2 lines, selling unit (`per 1 kg`, `isi 10 butir`), formatted IDR price (`price-md`).
* Action: Bottom right quick-add button or quantity stepper.

### 3.3 Quantity Stepper (*Pengatur Jumlah*)
* Pill container with circular `-` and `+` buttons ($\ge 32\text{px}$ touch targets).
* Center displays current integer quantity (`label-md`).
* When quantity equals 1, the decrement (`-`) button displays a subtle trash icon in `#EF4444` to confirm item removal.

### 3.4 Payment Method Selector
* Selectable radio cards for:
  1. **Transfer Bank** (*Bank BCA / Mandiri / BRI*): Displays account instructions and manual WhatsApp proof notice.
  2. **Bayar di Toko** (*Tunai / Kasir*): Displays counter payment note.
* Active state: Border `2px solid #16A34A`, subtle light green background tint `#F0FDF4`.

### 3.5 Floating Mobile Cart Dock (*Bar Keranjang Mengambang*)
* Persistently pinned to mobile viewport bottom above device home indicator.
* Left side: Item count badge (*"3 Barang"*) and grand total in bold IDR (`price-lg`).
* Right side: Primary CTA (*"Lihat Keranjang"* or *"Beli Sekarang"*).

---

## 4. Screen Specifications (Mapped to Google Stitch Screens)

The 12 screens from Stitch Project `4873199083941307327` provide comprehensive coverage:

### 4.1 Storefront & Customer Journey

#### Screen 1: Beranda Toko Sembako (`b19273cc`)
* **Role**: Primary storefront landing page.
* **Layout**:
  * Top Navigation Bar: Store branding (*"Warung Segar Tetangga"* / *"Santo Groceries"*), location indicator, search bar, and cart badge.
  * Hero Banner: Store operating hours (*"Buka Setiap Hari: 08:00 - 17:00"*), pickup address highlight, and daily fresh highlights.
  * Category Quick-Nav: Horizontal scrolling chips (*Beras & Gandum*, *Minyak & Mentega*, *Telur & Susu*, *Gula & Garam*, *Bumbu Dapur*).
  * Featured Products: 2-column mobile / 4-column desktop card grid.

#### Screen 2: Katalog Sembako (`36198a42`)
* **Role**: Complete browsable product catalog.
* **Layout**:
  * Sticky search bar with auto-clear icon and instant name filtering.
  * Category filter chips with item counters.
  * Stock availability indicator: Shows real-time calculated stock (`Tersedia: 14 kg`).
  * Out-of-stock items displayed with disabled buttons and "Stok Habis" badge.

#### Screen 3: Keranjang Belanja (`30b3b161`)
* **Role**: Shopping cart drawer / dedicated page.
* **Layout**:
  * Header: Item count and store fulfillment badge (*Ambil di Toko*).
  * Item List: Line item rows with thumbnail, snapshot name, unit price, quantity stepper, and calculated integer line total.
  * Summary Box: Subtotal calculation in IDR.
  * Action: Prominent CTA *"Lanjut ke Pembayaran"* leading to checkout.

#### Screen 4: Checkout Pesanan - Desktop (`8b90800c`)
* **Role**: Full desktop checkout screen (1280px).
* **Layout**:
  * Left Column (2/3 width): Customer details form (Nama Lengkap, Nomor WhatsApp), fulfillment review (Ambil di Toko address & hours), and payment method radio cards (*Transfer Bank* vs *Bayar di Toko*).
  * Right Column (1/3 width): Sticky order summary card with item breakdown, total IDR, and submit button.

#### Screen 5: Checkout Tamu - Mobile 360px (`7b1a2021`)
* **Role**: Mobile guest checkout optimized for 360px viewport.
* **Layout**:
  * Single-column vertical stream; zero horizontal scrolling.
  * Form fields with 48px height and large legible labels.
  * WhatsApp number input includes Indonesian prefix indicator (`+62` / `08`).
  * Radio card selection with large tap targets.
  * Bottom pinned *"Kirim Pesanan Sekarang"* CTA.

#### Screen 6: Konfirmasi Pesanan (`ea1d1765`)
* **Role**: Post-order placement confirmation and WhatsApp handoff.
* **Layout**:
  * Success Badge: Green celebration icon with headline *"Pesanan Berhasil Disimpan!"*
  * Order Reference Box: Bold human-readable reference code (e.g., `ORD-202610-0042`).
  * Secret Tracking Link Card: Non-enumerable link card with *"Salin Tautan Cek Status"* button and explicit notice: *"Simpan tautan ini untuk mengecek status pesanan tanpa akun"*.
  * WhatsApp Handoff CTA: High-contrast green button *"Hubungi Toko via WhatsApp"* linking to `https://wa.me/` with prefilled summary. Includes disclaimer: *"Pesanan Anda telah tersimpan di sistem toko kami. Membuka WhatsApp bersifat opsional untuk koordinasi lanjutan"*.
  * Store Pickup Card: Address map snippet and operating hours.
  * Bank Transfer Instructions: Bank name, account number, and account holder name (if bank transfer chosen).

#### Screen 7: Cek Status Pesanan (`ded4af8fd`)
* **Role**: Dedicated order tracker page accessed via secret token or registered account.
* **Layout**:
  * Current status timeline stepper: `Diajukan` $\rightarrow$ `Diterima` $\rightarrow$ `Disiapkan` $\rightarrow$ `Siap Diambil` $\rightarrow$ `Selesai`.
  * Payment status badge (`Menunggu Pembayaran` / `Pembayaran Terkonfirmasi`).
  * Ordered items breakdown with snapshot prices.
  * Store contact button via WhatsApp for questions.

---

### 4.2 Staff Operations Dashboard

#### Screen 8: Dashboard Operasional (`5fd90dfd` & `c7676877`)
* **Role**: Staff administrative home overview.
* **Layout**:
  * Metric KPI Cards: Active orders counter, pending bank transfer verifications count, orders ready for pickup count, low-stock alerts.
  * Recent Orders Queue: Fast-action table showing order reference, customer name, total IDR, payment state, and quick action buttons.

#### Screen 9: Manajemen Antrean Pesanan (`47d716e7`)
* **Role**: Comprehensive order lifecycle processing.
* **Layout**:
  * Tabs for order state filtering: *Semua*, *Diajukan*, *Diterima*, *Disiapkan*, *Siap Diambil*, *Selesai*, *Dibatalkan*.
  * Quick filter for payment state: *Belum Bayar* vs *Lunas*.
  * State transition action buttons:
    * *"Terima Pesanan"* (`accepted`)
    * *"Mulai Menyiapkan"* (`preparing`)
    * *"Siap Diambil"* (`ready_for_pickup`)
    * *"Selesaikan Pesanan"* (`collected`) — **disabled with tooltip if payment is pending**.
  * *"Batalkan Pesanan"* button opening modal with mandatory reason selection (*Stok Tidak Sesuai*, *Permintaan Pelanggan*, *Pesanan Ditinggalkan*).

#### Screen 10: Katalog & Manajemen Stok (`9fdc07f6`)
* **Role**: Staff inventory and catalog maintenance.
* **Layout**:
  * Searchable and filterable product table.
  * Columns: Image, Product Name, Category, Unit, Price (IDR), On-Hand (*Stok Fisik*), Reserved (*Stok Terpesan*), Available (*Tersedia*), Status Active/Inactive.
  * Single-click toggle for product activation (`is_active`).
  * *"Sesuaikan Stok"* button opening adjustment modal: input quantity change (+/-), mandatory reason note, and validation preventing `on_hand < reserved`.

#### Screen 11: Pengaturan Toko (`3fc383bd`)
* **Role**: Store settings management.
* **Layout**:
  * Store profile form: Nama Toko, Alamat Fisik Lengkap, Jam Operasional Ambil di Toko.
  * Communication settings: Nomor WhatsApp Resmi Toko.
  * Bank Transfer settings: Nama Bank, Nomor Rekening, Nama Pemilik Rekening, Petunjuk Transfer.
  * Save button with instant persistence.

---

## 5. Responsive Testing & Accessibility Compliance

* **Mobile 360px Gate**: All customer flows (browsing, cart, guest checkout, confirmation) render seamlessly on a 360px width viewport with 0px horizontal scroll and touch targets $\ge 44\text{px}$.
* **Desktop 1280px Gate**: Staff dashboard operates with full-width tables, side-by-side modal panels, and clear data columns.
* **High Contrast & Sunlight Legibility**: Text colors `--color-text-primary` (`#0F172A`) against `#FFFFFF` provide a contrast ratio $> 14:1$, exceeding WCAG AAA standards.
