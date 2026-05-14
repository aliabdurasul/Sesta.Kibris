-- Migration: 00009_create_indexes
-- Performance indexes per DATABASE.md section 4
-- All merchant_id columns indexed for RLS performance

-- merchants
-- slug UNIQUE index already created by UNIQUE constraint in migration 00001
CREATE INDEX IF NOT EXISTS idx_merchants_owner
  ON merchants (owner_user_id);

-- products
CREATE INDEX IF NOT EXISTS idx_products_merchant_id
  ON products (merchant_id);

CREATE INDEX IF NOT EXISTS idx_products_merchant_available
  ON products (merchant_id, is_available);

-- customer_addresses
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id
  ON customer_addresses (customer_id);

-- couriers
CREATE INDEX IF NOT EXISTS idx_couriers_merchant_id
  ON couriers (merchant_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id
  ON orders (merchant_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id
  ON orders (customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_courier_id
  ON orders (courier_id)
  WHERE courier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

-- Composite for active order queue (most common merchant query)
CREATE INDEX IF NOT EXISTS idx_orders_merchant_status
  ON orders (merchant_id, status, created_at DESC);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

-- order_status_log
CREATE INDEX IF NOT EXISTS idx_status_log_order_id
  ON order_status_log (order_id);
