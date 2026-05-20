-- Migration: 00018_public_catalog_rls
-- Tighten public catalog RLS for merchants + products (Phase 1 storefront).
--
-- products table has is_available (NOT is_active — that column does not exist).
-- Public products: available AND parent merchant is active.

DROP POLICY IF EXISTS products_select_public ON products;
CREATE POLICY products_select_public ON products
  FOR SELECT
  USING (
    is_available = true
    AND EXISTS (
      SELECT 1
      FROM merchants m
      WHERE m.id = products.merchant_id
        AND m.is_active = true
    )
  );

DROP POLICY IF EXISTS merchants_select_public ON merchants;
CREATE POLICY merchants_select_public ON merchants
  FOR SELECT
  USING (is_active = true);

-- Merchant can read own row via user_id OR owner_user_id (migration 00016)
DROP POLICY IF EXISTS merchants_select_own_by_user_id ON merchants;
CREATE POLICY merchants_select_own_by_user_id ON merchants
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS merchants_select_own ON merchants;
CREATE POLICY merchants_select_own ON merchants
  FOR SELECT
  USING (owner_user_id = auth.uid());
