-- Migration: 00012_rls_customers_couriers
-- RLS policies for customers, customer_addresses, and couriers
-- Per RLS_POLICIES.md sections 3.3, 3.4, and 3.5

-- ============================================================
-- CUSTOMERS
-- ============================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

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

-- DELETE: not permitted (retain customer records)

-- ============================================================
-- CUSTOMER_ADDRESSES
-- ============================================================

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

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
-- COURIERS
-- ============================================================

ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;

-- Merchant can see all couriers belonging to them
CREATE POLICY couriers_select_merchant ON couriers
  FOR SELECT
  USING (merchant_id = auth.user_merchant_id());

-- Courier can see their own record
CREATE POLICY couriers_select_own ON couriers
  FOR SELECT
  USING (user_id = auth.uid());

-- Merchant can update their couriers (activate/deactivate)
CREATE POLICY couriers_update_merchant ON couriers
  FOR UPDATE
  USING (merchant_id = auth.user_merchant_id())
  WITH CHECK (merchant_id = auth.user_merchant_id());

-- INSERT: service role only (courier creation via Edge Function)
-- DELETE: not permitted (soft delete via is_active = false)
