-- Migration: 00037_create_merchant_inventory
-- Merchant ↔ global_product mapping table.
-- Merchants control: price, stock_count, is_available, display_order.
-- All other product data (name, image, category) lives in global_products.

CREATE TABLE IF NOT EXISTS merchant_inventory (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id   uuid        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  product_id    uuid        NOT NULL REFERENCES global_products(id) ON DELETE CASCADE,
  price         integer     NOT NULL CHECK (price > 0),  -- kuruş (1/100 TL); must be > 0
  stock_count   integer,                                  -- NULL = unlimited stock
  is_available  boolean     NOT NULL DEFAULT false,       -- false until merchant explicitly activates
  display_order integer     NOT NULL DEFAULT 0,
  attached_at   timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (merchant_id, product_id)
);

COMMENT ON TABLE merchant_inventory IS 'Merchant-scoped inventory. Maps global_products to a merchant with price/stock/availability.';
COMMENT ON COLUMN merchant_inventory.price IS 'Price in kuruş (1/100 Turkish Lira). CHECK price > 0 prevents zero-price listings.';
COMMENT ON COLUMN merchant_inventory.stock_count IS 'NULL = unlimited. Set to 0 to signal out-of-stock without removing the listing.';
COMMENT ON COLUMN merchant_inventory.is_available IS 'Defaults false. Merchant must set price then toggle to true before product appears on storefront.';
COMMENT ON COLUMN merchant_inventory.display_order IS 'Lower values appear first within this merchant''s storefront listing.';

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE TRIGGER merchant_inventory_updated_at
  BEFORE UPDATE ON merchant_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Storefront: all available items for a merchant, sorted
CREATE INDEX IF NOT EXISTS idx_merchant_inventory_storefront
  ON merchant_inventory(merchant_id, display_order, price)
  WHERE is_available;

-- Product lookup: who carries this product?
CREATE INDEX IF NOT EXISTS idx_merchant_inventory_product
  ON merchant_inventory(product_id);

-- Price comparison: cheapest merchant for a given product
CREATE INDEX IF NOT EXISTS idx_merchant_inventory_price_compare
  ON merchant_inventory(product_id, price)
  WHERE is_available;

-- Merchant admin view: all their products regardless of availability
CREATE INDEX IF NOT EXISTS idx_merchant_inventory_merchant_all
  ON merchant_inventory(merchant_id, display_order);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE merchant_inventory ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated): see available items only
-- Note: app layer also filters price > 0 for storefront display
DROP POLICY IF EXISTS merchant_inventory_public_read ON merchant_inventory;
CREATE POLICY merchant_inventory_public_read ON merchant_inventory
  FOR SELECT
  USING (is_available = true);

-- Authenticated merchant: SELECT all rows (own + others) for catalog browsing
-- Needed so merchant can see which products are already in their inventory
DROP POLICY IF EXISTS merchant_inventory_merchant_select ON merchant_inventory;
CREATE POLICY merchant_inventory_merchant_select ON merchant_inventory
  FOR SELECT
  TO authenticated
  USING (public.user_has_role('merchant'));

-- Merchant INSERT: own rows only
DROP POLICY IF EXISTS merchant_inventory_merchant_insert ON merchant_inventory;
CREATE POLICY merchant_inventory_merchant_insert ON merchant_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_role('merchant')
    AND merchant_id = public.user_merchant_id()
  );

-- Merchant UPDATE: own rows only
DROP POLICY IF EXISTS merchant_inventory_merchant_update ON merchant_inventory;
CREATE POLICY merchant_inventory_merchant_update ON merchant_inventory
  FOR UPDATE
  TO authenticated
  USING (
    public.user_has_role('merchant')
    AND merchant_id = public.user_merchant_id()
  )
  WITH CHECK (
    public.user_has_role('merchant')
    AND merchant_id = public.user_merchant_id()
  );

-- Merchant DELETE: own rows only (remove product from their store)
DROP POLICY IF EXISTS merchant_inventory_merchant_delete ON merchant_inventory;
CREATE POLICY merchant_inventory_merchant_delete ON merchant_inventory
  FOR DELETE
  TO authenticated
  USING (
    public.user_has_role('merchant')
    AND merchant_id = public.user_merchant_id()
  );

-- Admin: full access
DROP POLICY IF EXISTS merchant_inventory_admin_all ON merchant_inventory;
CREATE POLICY merchant_inventory_admin_all ON merchant_inventory
  FOR ALL
  TO authenticated
  USING     (public.user_has_role('admin'))
  WITH CHECK (public.user_has_role('admin'));
