-- 001_initial_schema.up.sql
-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    selling_unit VARCHAR(50) NOT NULL,
    price_idr BIGINT NOT NULL CHECK (price_idr >= 0),
    image_url TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Index for product category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 2. inventory
CREATE TABLE IF NOT EXISTS inventory (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE RESTRICT,
    on_hand INTEGER NOT NULL CHECK (on_hand >= 0),
    reserved INTEGER NOT NULL CHECK (reserved >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_on_hand_ge_reserved CHECK (on_hand >= reserved)
);

-- 3. staff_users
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 4. customer_accounts
CREATE TABLE IF NOT EXISTS customer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    reset_token_hash VARCHAR(64) NULL,
    reset_token_expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_customer_accounts_email ON customer_accounts(email);

-- 5. inventory_adjustments
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    actor_id UUID NOT NULL REFERENCES staff_users(id),
    change_qty INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 6. orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code VARCHAR(32) UNIQUE NOT NULL,
    guest_token_hash VARCHAR(64) NULL,
    customer_id UUID NULL REFERENCES customer_accounts(id),
    customer_name VARCHAR(150) NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    order_state VARCHAR(30) NOT NULL DEFAULT 'submitted',
    payment_state VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(30) NOT NULL,
    total_amount_idr BIGINT NOT NULL CHECK (total_amount_idr >= 0),
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    cancellation_reason VARCHAR(255) NULL,
    refund_notes TEXT NULL,
    refund_bank_ref VARCHAR(100) NULL,
    refund_date DATE NULL,
    guest_token_expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_orders_reference_code ON orders(reference_code);
CREATE INDEX IF NOT EXISTS idx_orders_guest_token_hash ON orders(guest_token_hash);

-- 7. order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    name_snapshot VARCHAR(255) NOT NULL,
    unit_snapshot VARCHAR(50) NOT NULL,
    price_idr_snapshot BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total_idr BIGINT NOT NULL
);

-- 8. order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    from_state VARCHAR(30) NOT NULL,
    to_state VARCHAR(30) NOT NULL,
    actor_type VARCHAR(20) NOT NULL,
    actor_id UUID NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 9. store_settings
CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    shop_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    pickup_hours VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    bank_instructions TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
