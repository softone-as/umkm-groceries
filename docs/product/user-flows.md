# User Flows & Operational Journeys

Status: Derived from [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md)  
Last Updated: 2026-10-09  

---

## 1. Customer Journey: Browse, Cart & Checkout

```mermaid
flowchart TD
    A[Customer enters storefront] --> B[Browse catalog / Search / Filter category]
    B --> C[Select integer quantity & add to Cart]
    C --> D{Review Cart}
    D -->|Adjust / Remove| C
    D -->|Proceed| E{Customer Type}
    E -->|Guest| F[Provide Name & WhatsApp Number]
    E -->|Registered| G[Sign In / Account Session]
    F --> H[Select Payment Method]
    G --> H
    H -->|Bank Transfer or In-Store| I[Submit Order with Idempotency Key]
    I --> J{Server Price & Stock Validation}
    J -->|Stock Exhausted or Price Changed| K[Present Review Error / Update Cart]
    K --> D
    J -->|Valid| L[Atomic DB Transaction: Create Order + Reserve Stock]
    L --> M[Display Confirmation Screen with Order Ref & Secret Link]
    M --> N[Optional: Click Prefilled WhatsApp Link]
```

### 1.1 Step-by-Step Breakdown
1. **Catalog Exploration**: Customer searches products or filters by category. Live on-hand and reserved levels define availability (`on_hand - reserved`). Items with 0 availability are disabled from cart addition.
2. **Cart Building**: Customer inputs positive integer quantities. Line totals and order subtotal are computed in IDR.
3. **Checkout Selection**:
   * **Guest**: Enters recipient full name and valid Indonesian WhatsApp phone number.
   * **Registered**: Authenticates with existing account; previous order history becomes accessible.
   * **Fulfillment**: Fixed to In-Store Pickup (*Ambil di Toko*).
   * **Payment Method**: Chooses either Bank Transfer (*Transfer Bank*) or Pay at Store (*Bayar di Toko*).
4. **Order Submission**: Client dispatches `POST /api/v1/orders` with an `Idempotency-Key` header.
5. **Server Transaction**:
   * Evaluates current product catalog prices.
   * Acquires row locks on target inventory records.
   * Verifies `available >= requested_qty`.
   * Inserts order and order item snapshots.
   * Increments `reserved` stock by `requested_qty`.
   * Returns order reference code and non-enumerable secret guest access token.
6. **Order Confirmation & External Handoff**:
   * Confirmation UI renders the order summary, bank transfer instructions (if applicable), store physical address, and pickup hours.
   * Renders a `Hubungi Toko via WhatsApp` button linking to `https://wa.me/<store_number>?text=<encoded_summary>`.
   * The customer may safely close the browser; the order is securely stored.

---

## 2. Customer Journey: Order Status Inspection

```mermaid
flowchart TD
    A[Customer wants to inspect order] --> B{Access Method}
    B -->|Guest| C[Open saved Secret Link]
    B -->|Registered| D[Sign in & navigate to My Orders]
    C --> E[Backend verifies Secret Token Hash]
    D --> F[Backend verifies Session & customer_id]
    E --> G[Render Order Details, Current State & Pickup Info]
    F --> G
    B -->|Attempts Public Ref Alone| H[Blocked: 401/404 Access Denied]
```

### 2.1 Guest Order Access
* Guests receive a unique URL at checkout: `/orders/guest?token=<secret_token>`.
* The server hashes the incoming token and looks up the corresponding order.
* Public order references (e.g., `ORD-202610-0012`) cannot be used alone to view customer phone numbers, names, or item breakdowns.

---

## 3. Staff Journey: Order Processing & Pickup

```mermaid
flowchart TD
    A[Staff opens Dashboard Orders] --> B[Filter by state: submitted, accepted, preparing]
    B --> C[Select Order to Inspect]
    C --> D{Payment Method}
    D -->|Bank Transfer| E[Verify manual proof received on WhatsApp against Bank]
    D -->|Pay at Store| F[Customer arrives at counter to pay]
    E --> G[Mark Payment: Confirmed]
    F --> G
    C --> H[Transition State: accepted -> preparing -> ready_for_pickup]
    H --> I[Customer arrives for pickup]
    I --> J{Is Payment Confirmed?}
    J -->|No| K[Block Collection: Must confirm payment first]
    K --> G
    J -->|Yes| L[Mark State: collected]
    L --> M[Atomic DB Transaction: on_hand -= qty, reserved -= qty]
```

### 3.1 Order State Transitions
1. **`submitted`**: Initial state upon successful checkout. Inventory is reserved.
2. **`accepted`**: Staff acknowledges receipt and validates order feasibility.
3. **`preparing`**: Staff physically picks groceries from store shelves.
4. **`ready_for_pickup`**: Goods are bagged and staged at the counter. Staff may notify customer manually via WhatsApp.
5. **`collected`**: Customer takes possession of goods. **Payment must be `confirmed` before this step.** Decrements both `on_hand` and `reserved`.

---

## 4. Staff Journey: Order Cancellation & Inventory Release

```mermaid
flowchart TD
    A[Cancellation Triggered] --> B{Trigger Source}
    B -->|Customer Request via WhatsApp| C[Staff locates order in dashboard]
    B -->|Staff Review: Abandoned / Out of Stock| C
    C --> D{Is Order already Collected?}
    D -->|Yes| E[Standard Cancellation Forbidden]
    D -->|No| F{Has Payment been Confirmed?}
    F -->|Yes| G[Staff executes manual bank refund outside system]
    G --> H[Record refund note & cancellation reason]
    F -->|No| H
    H --> I[Mark State: cancelled]
    I --> J[Atomic DB Transaction: reserved -= qty, on_hand unchanged]
```

### 4.1 Cancellation Business Rules
* Any uncollected order (`submitted`, `accepted`, `preparing`, `ready_for_pickup`) can be cancelled by staff.
* Cancellation reasons must be recorded (e.g., `customer_request`, `abandoned_unpaid`, `incorrect_stock`).
* If payment was already marked `confirmed`, staff must handle the refund manually through banking channels before recording resolution.
