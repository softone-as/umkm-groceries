# Domain Glossary & Terminology

Status: Authoritative Reference  
Language Context: Bilingual (Bahasa Indonesia & English Engineering Terms)  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md)  
Last Updated: 2026-10-09  

---

## 1. Domain Concepts (Retail & Sembako)

* **Toko Sembako**: A neighborhood grocery store specializing in the nine essential daily staples (*sembilan bahan pokok*: rice, sugar, cooking oil, eggs, flour, etc.) along with household packaged goods.
* **On-Hand Stock (*Stok Fisik*)**: The actual quantity of product physically present in the store available to be touched or picked.
* **Reserved Stock (*Stok Terpesan*)**: The quantity of product allocated to pending, accepted, or ready online orders that have not yet been picked up by customers.
* **Available Stock (*Stok Tersedia*)**: The net quantity visible to shoppers on the web storefront that is free to be added to carts and ordered. Formula: $\text{On-Hand} - \text{Reserved}$.
* **Selling Unit (*Satuan Jual*)**: The packaging or measurement unit used for retail pricing (e.g., `kg`, `liter`, `pcs`, `bungkus`, `ikat`, `botol`, `dus`). Must be ordered in positive whole integer multiples in MVP.
* **In-Store Pickup (*Ambil di Toko*)**: The fulfillment model where customers physically visit the store counter to retrieve pre-packaged orders. The only fulfillment model in MVP.

---

## 2. Order & Payment Lifecycle Terms

* **Order Reference Code (*Kode Referensi Pesanan*)**: A human-friendly identifier (e.g., `ORD-202610-0042`) used for conversational communication between customer and staff via WhatsApp or at the store counter. Never grants authorization to view private order data.
* **Guest Access Token (*Token Akses Tamu*)**: A high-entropy (minimum 128-bit) unguessable cryptographic token embedded in guest order tracking URLs (`/orders/guest?token=...`). Grants read-only access to that specific order. Stored in hashed format in the database.
* **Order States (*Status Pesanan*)**:
  * `submitted` (*Diajukan*): Order placed by customer, stock reserved, awaiting staff processing.
  * `accepted` (*Diterima*): Staff has reviewed and accepted the order into the fulfillment queue.
  * `preparing` (*Sedang Disiapkan*): Staff is picking and packaging products.
  * `ready_for_pickup` (*Siap Diambil*): Order is boxed/bagged and staged at the pickup counter.
  * `collected` (*Selesai Diambil*): Goods handed to customer. Terminal state. Requires payment to be confirmed.
  * `cancelled` (*Dibatalkan*): Order terminated by staff prior to collection. Terminal state. Releases reservations.
* **Payment States (*Status Pembayaran*)**:
  * `pending` (*Menunggu Verifikasi*): Payment not yet confirmed. Default state for all newly submitted orders.
  * `confirmed` (*Terkonfirmasi*): Staff has verified bank settlement or received physical cash.

---

## 3. Engineering & Technical Terms

* **Idempotency Key**: A unique client-generated UUID sent in the HTTP request header (`Idempotency-Key`) to ensure retry requests do not result in multiple orders or duplicated stock reservations.
* **Atomic Transaction**: A database operation wrapped in `BEGIN ... COMMIT` ensuring all changes (order insertion, item snapshots, stock reservation updates) either succeed completely or roll back entirely.
* **Order Snapshot**: An immutable copy of product title, price in IDR, selling unit, and customer details written directly into the order item rows at checkout, safeguarding historical records against subsequent catalog edits.
* **Click-to-Chat Handoff**: A standard URL (`https://wa.me/...`) that launches the native WhatsApp client with pre-filled plain text. It does not invoke an API or guarantee message delivery.
