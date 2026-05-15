-- Migration: 00014_fix_all_rls_policies
-- Comprehensive RLS policy setup - drops and recreates all policies
-- Consolidates and fixes migrations 00011, 00012, 00013

-- ============================================================
-- DROP ALL EXISTING POLICIES (cleanup)
-- ============================================================

-- Merchants
DROP POLICY IF EXISTS merchants_select_public ON merchants;
DROP POLICY IF EXISTS merchants_select_own ON merchants;
DROP POLICY IF EXISTS merchants_update_own ON merchants;

-- Products
DROP POLICY IF EXISTS products_select_public ON products;
DROP POLICY IF EXISTS products_select_merchant ON products;
DROP POLICY IF EXISTS products_insert_merchant ON products;
DROP POLICY IF EXISTS products_update_merchant ON products;

-- Customers
DROP POLICY IF EXISTS customers_select_own ON customers;
DROP POLICY IF EXISTS customers_insert_own ON customers;
DROP POLICY IF EXISTS customers_update_own ON customers;

-- Customer Addresses
DROP POLICY IF EXISTS addresses_select_own ON customer_addresses;
DROP POLICY IF EXISTS addresses_insert_own ON customer_addresses;
DROP POLICY IF EXISTS addresses_update_own ON customer_addresses;
DROP POLICY IF EXISTS addresses_delete_own ON customer_addresses;

-- Couriers
DROP POLICY IF EXISTS couriers_select_merchant ON couriers;
DROP POLICY IF EXISTS couriers_select_own ON couriers;
DROP POLICY IF EXISTS couriers_update_merchant ON couriers;

-- Orders
DROP POLICY IF EXISTS orders_select_customer ON orders;
DROP POLICY IF EXISTS orders_select_merchant ON orders;
DROP POLICY IF EXISTS orders_select_courier ON orders;

-- Order Items
DROP POLICY IF EXISTS order_items_select_customer ON order_items;
DROP POLICY IF EXISTS order_items_select_merchant ON order_items;
DROP POLICY IF EXISTS order_items_select_courier ON order_items;

-- Order Status Log
DROP POLICY IF EXISTS status_log_select_customer ON order_status_log;
DROP POLICY IF EXISTS status_log_select_merchant ON order_status_log;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MERCHANTS POLICIES
-- ============================================================

CREATE POLICY merchants_select_public ON merchants
  FOR SELECT
  USING (is_active = true);

CREATE POLICY merchants_select_own ON merchants
  FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY merchants_update_own ON merchants
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- ============================================================
-- PRODUCTS POLICIES
-- ============================================================

CREATE POLICY products_select_public ON products
  FOR SELECT
  USING (is_available = true);

CREATE POLICY products_select_merchant ON products
  FOR SELECT
  USING (merchant_id = public.user_merchant_id());

CREATE POLICY products_insert_merchant ON products
  FOR INSERT
  WITH CHECK (merchant_id = public.user_merchant_id());

CREATE POLICY products_update_merchant ON products
  FOR UPDATE
  USING (merchant_id = public.user_merchant_id())
  WITH CHECK (merchant_id = public.user_merchant_id());

-- ============================================================
-- CUSTOMERS POLICIES
-- ============================================================

CREATE POLICY customers_select_own ON customers
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY customers_insert_own ON customers
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY customers_update_own ON customers
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- CUSTOMER_ADDRESSES POLICIES
-- ============================================================

CREATE POLICY addresses_select_own ON customer_addresses
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY addresses_insert_own ON customer_addresses
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY addresses_update_own ON customer_addresses
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY addresses_delete_own ON customer_addresses
  FOR DELETE
  USING (customer_id = auth.uid());

-- ============================================================
-- COURIERS POLICIES
-- ============================================================

CREATE POLICY couriers_select_merchant ON couriers
  FOR SELECT
  USING (merchant_id = public.user_merchant_id());

CREATE POLICY couriers_select_own ON couriers
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY couriers_update_merchant ON couriers
  FOR UPDATE
  USING (merchant_id = public.user_merchant_id())
  WITH CHECK (merchant_id = public.user_merchant_id());

-- ============================================================
-- ORDERS POLICIES
-- ============================================================

CREATE POLICY orders_select_customer ON orders
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY orders_select_merchant ON orders
  FOR SELECT
  USING (merchant_id = public.user_merchant_id());

CREATE POLICY orders_select_courier ON orders
  FOR SELECT
  USING (courier_id = public.user_courier_id());

-- ============================================================
-- ORDER_ITEMS POLICIES
-- ============================================================

CREATE POLICY order_items_select_customer ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY order_items_select_merchant ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.merchant_id = public.user_merchant_id()
    )
  );

CREATE POLICY order_items_select_courier ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.courier_id = public.user_courier_id()
    )
  );

-- ============================================================
-- ORDER_STATUS_LOG POLICIES
-- ============================================================

CREATE POLICY status_log_select_customer ON order_status_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_log.order_id
        AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY status_log_select_merchant ON order_status_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_log.order_id
        AND orders.merchant_id = public.user_merchant_id()
    )
  );
