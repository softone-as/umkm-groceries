# Automation Selectors & Responsive Testing Guide

Status: Authoritative UI Automation Standard  
Source: [`docs/PRD.md`](file:///Users/shofwanasy/projects/santo-groceries/docs/PRD.md) §4  
Last Updated: 2026-10-09  

---

## 1. Automation Conventions (`data-testid`)

All interactive elements, input fields, and status indicators must expose unambiguous `data-testid` attributes to ensure robust end-to-end testing across mobile and desktop viewports.

### 1.1 Storefront: Catalog & Product Browsing
* `data-testid="search-input"`: Search input box for product name.
* `data-testid="category-filter-select"`: Category dropdown or filter chips.
* `data-testid="product-card-${productId}"`: Container card for a product.
* `data-testid="product-title-${productId}"`: Product name text element.
* `data-testid="product-price-${productId}"`: Formatted IDR price.
* `data-testid="product-availability-${productId}"`: Availability indicator badge.
* `data-testid="product-quantity-input-${productId}"`: Quantity input field.
* `data-testid="product-add-to-cart-btn-${productId}"`: Add to cart button.

### 1.2 Storefront: Cart Drawer & Checkout
* `data-testid="cart-toggle-btn"`: Button opening cart drawer.
* `data-testid="cart-drawer"`: Cart slide-out/modal container.
* `data-testid="cart-item-${productId}"`: Line item container.
* `data-testid="cart-item-qty-${productId}"`: Item quantity controls.
* `data-testid="cart-item-total-${productId}"`: Line item total.
* `data-testid="cart-subtotal"`: Subtotal amount in IDR.
* `data-testid="checkout-proceed-btn"`: Button to open checkout form.
* `data-testid="checkout-customer-name-input"`: Customer name input.
* `data-testid="checkout-whatsapp-input"`: WhatsApp phone number input.
* `data-testid="payment-method-bank-transfer"`: Radio button for Bank Transfer.
* `data-testid="payment-method-pay-at-store"`: Radio button for Pay at Store.
* `data-testid="checkout-submit-btn"`: Final order submission button.

### 1.3 Storefront: Order Confirmation & Guest Tracking
* `data-testid="order-confirmation-container"`: Confirmation screen container.
* `data-testid="order-reference-code"`: Human-readable reference code (`ORD-...`).
* `data-testid="order-state-badge"`: Current order state indicator.
* `data-testid="order-payment-badge"`: Current payment state indicator.
* `data-testid="order-total-amount"`: Total amount due in IDR.
* `data-testid="whatsapp-handoff-btn"`: Link button initiating WhatsApp chat.
* `data-testid="guest-tracking-url-copy"`: Element / button for copying secret tracking link.
* `data-testid="store-pickup-address"`: Store address container.
* `data-testid="store-pickup-hours"`: Store operating hours container.

### 1.4 Staff Dashboard
* `data-testid="staff-login-username"`: Staff login username input.
* `data-testid="staff-login-password"`: Staff login password input.
* `data-testid="staff-login-submit"`: Staff login submit button.
* `data-testid="orders-table"`: Order list table.
* `data-testid="order-row-${orderId}"`: Individual order row.
* `data-testid="order-state-filter"`: Order state filter dropdown.
* `data-testid="payment-state-filter"`: Payment state filter dropdown.
* `data-testid="btn-mark-payment-confirmed"`: Confirm payment button.
* `data-testid="btn-transition-accepted"`: Mark accepted button.
* `data-testid="btn-transition-preparing"`: Mark preparing button.
* `data-testid="btn-transition-ready"`: Mark ready for pickup button.
* `data-testid="btn-transition-collected"`: Mark collected button.
* `data-testid="btn-cancel-order"`: Cancel order modal trigger.
* `data-testid="cancel-reason-select"`: Cancellation reason dropdown (including `incorrect_stock`).
* `data-testid="cancel-confirm-btn"`: Confirm cancellation button.

---

## 2. Responsive Viewport Testing Criteria

Per the PRD release gates, automation tests must execute across both target breakpoints:

| Viewport Target | Dimensions | Specific Checks |
| :--- | :--- | :--- |
| **Mobile Primary** | Width: `360px`, Height: `740px` | No horizontal document overflow (`scrollWidth === clientWidth`). Cart drawer fits mobile screen without clipping. Touch targets $\ge 44 \times 44$px. |
| **Desktop Standard** | Width: `1280px`, Height: `800px` | Clean dashboard multi-column layout. Order table legible with full action buttons. Modal dialogs centered. |
