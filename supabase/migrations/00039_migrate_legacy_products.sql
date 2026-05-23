-- Migration: 00039_migrate_legacy_products
-- ═══════════════════════════════════════════════════════════════════════════════
-- SAFE on ALL environments including production.
--
-- What this migration does:
--   1. Renames the old `products` table → `legacy_merchant_products`.
--      The rename is safe: all existing order_items.product_id FKs remain valid
--      because PostgreSQL tracks them by OID, not table name.
--
--   2. Drops the old RLS policies on `products` (now named `legacy_merchant_products`)
--      and replaces them with admin-only read policies so historical data is
--      accessible for order history resolution without merchant write access.
--
--   3. Does NOT insert any rows into global_products.
--      → Production:  global_products starts empty; data enters via Admin UI.
--      → Local/staging: seed_global_products.sql (run separately) fills it.
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Rename table ───────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS products RENAME TO legacy_merchant_products;

COMMENT ON TABLE legacy_merchant_products IS
  'Archived merchant-owned product rows from pre-catalog schema (migrations 00001–00033). '
  'Used for order_items FK resolution on orders placed before the global catalog migration. '
  'Do NOT write new rows. Do NOT delete. Admin + service-role read only.';

-- ── 2. Rename the updated_at trigger to match new table name ─────────────────

ALTER TRIGGER products_updated_at ON legacy_merchant_products
  RENAME TO legacy_merchant_products_updated_at;

-- ── 3. Replace RLS policies ───────────────────────────────────────────────────
-- Remove any existing policies from the old table (names may vary by environment).

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'legacy_merchant_products'
      AND schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON legacy_merchant_products',
      pol.policyname
    );
  END LOOP;
END $$;

-- RLS stays enabled (was enabled on the old products table)
ALTER TABLE legacy_merchant_products ENABLE ROW LEVEL SECURITY;

-- Admin + service role: read-only for order history resolution
CREATE POLICY legacy_products_admin_read ON legacy_merchant_products
  FOR SELECT
  TO authenticated
  USING (public.user_has_role('admin'));

-- Merchants can still read their own legacy products (useful for order history display)
CREATE POLICY legacy_products_merchant_own_read ON legacy_merchant_products
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_role('merchant')
    AND merchant_id = public.user_merchant_id()
  );
