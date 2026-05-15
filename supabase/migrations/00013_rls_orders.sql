-- Migration: 00013_rls_orders
-- RLS policies for orders, order_items, and order_status_log
-- Per RLS_POLICIES.md section 3.6, 3.7, 3.8
-- This is the most complex RLS domain — three-way visibility

-- ============================================================
-- ORDERS
-- ============================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS orders_select_customer ON orders;
DROP POLICY IF EXISTS orders_select_merchant ON orders;
DROP POLICY IF EXISTS orders_select_courier ON orders;

-- Customer sees only their own orders
CREATE POLICY orders_select_customer ON orders
  FOR SELECT
  USING (customer_id = auth.uid());

-- Merchant sees orders for their merchant_id
CREATE POLICY orders_select_merchant ON orders
  FOR SELECT
  USING (merchant_id = public.user_merchant_id());

-- Courier sees only orders assigned to them
CREATE POLICY orders_select_courier ON orders
  FOR SELECT
  USING (courier_id = public.user_courier_id());

-- No client-level INSERT or UPDATE on orders
-- All mutations go through Edge Functions using service role key
-- This is the critical security rule: state machine lives in Edge Functions only

-- ============================================================
-- ORDER_ITEMS
-- ============================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS order_items_select_customer ON order_items;
DROP POLICY IF EXISTS order_items_select_merchant ON order_items;
DROP POLICY IF EXISTS order_items_select_courier ON order_items;

-- Customer can see items on their orders
CREATE POLICY order_items_select_customer ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.customer_id = auth.uid()
    )
  );

-- Merchant can see items on their orders
CREATE POLICY order_items_select_merchant ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.merchant_id = public.user_merchant_id()
    )
  );

-- Courier can see items on assigned orders
CREATE POLICY order_items_select_courier ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.courier_id = public.user_courier_id()
    )
  );

-- No client-level INSERT/UPDATE/DELETE — all via Edge Functions

-- ============================================================
-- ORDER_STATUS_LOG (append-only audit trail)
-- ============================================================

ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS status_log_select_customer ON order_status_log;
DROP POLICY IF EXISTS status_log_select_merchant ON order_status_log;

-- Customer can see the log for their orders
CREATE POLICY status_log_select_customer ON order_status_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_log.order_id
        AND orders.customer_id = auth.uid()
    )
  );

-- Merchant can see the log for their orders
CREATE POLICY status_log_select_merchant ON order_status_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_log.order_id
        AND orders.merchant_id = public.user_merchant_id()
    )
  );

-- No client-level INSERT/UPDATE/DELETE
-- Log entries are written only by Edge Functions via service role key
-- This table is APPEND-ONLY — no updates or deletes ever
