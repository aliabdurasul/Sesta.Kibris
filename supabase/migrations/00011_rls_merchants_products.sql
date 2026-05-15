-- Migration: 00011_rls_merchants_products
-- RLS policies for merchants and products tables
-- Per RLS_POLICIES.md sections 3.1 and 3.2

-- ============================================================
-- MERCHANTS
-- ============================================================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Public can read active merchants (for storefront listing)
CREATE POLICY merchants_select_public ON merchants
  FOR SELECT
  USING (is_active = true);

-- Merchant can always read their own record (even if inactive)
CREATE POLICY merchants_select_own ON merchants
  FOR SELECT
  USING (owner_user_id = auth.uid());

-- Merchant can update their own record
CREATE POLICY merchants_update_own ON merchants
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- INSERT and DELETE: service role only (admin Edge Functions)
-- No client-level INSERT/DELETE policies

-- ============================================================
-- PRODUCTS
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can read available products from any merchant
CREATE POLICY products_select_public ON products
  FOR SELECT
  USING (is_available = true);

-- Merchant can read ALL their own products (including unavailable)
CREATE POLICY products_select_merchant ON products
  FOR SELECT
  USING (merchant_id = public.user_merchant_id());

-- Merchant can insert products only for their own merchant_id
CREATE POLICY products_insert_merchant ON products
  FOR INSERT
  WITH CHECK (merchant_id = public.user_merchant_id());

-- Merchant can update their own products
CREATE POLICY products_update_merchant ON products
  FOR UPDATE
  USING (merchant_id = public.user_merchant_id())
  WITH CHECK (merchant_id = public.user_merchant_id());

-- DELETE: not permitted from client (soft delete via is_available = false)
