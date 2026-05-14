-- Migration: 00002_create_products
-- Product catalog, owned by merchant

CREATE TABLE IF NOT EXISTS products (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id   uuid        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text,
  price         integer     NOT NULL CHECK (price > 0),  -- stored in kurus (1/100 TL)
  unit          text        NOT NULL,                    -- e.g. "19L", "kg", "adet"
  stock_count   integer,                                 -- NULL = unlimited
  is_available  boolean     NOT NULL DEFAULT true,
  image_url     text,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE products IS 'Product catalog entries, owned by a merchant';
COMMENT ON COLUMN products.price IS 'Price in kurus (1/100 Turkish Lira) — integer to avoid floating point';
COMMENT ON COLUMN products.stock_count IS 'NULL means unlimited stock';
COMMENT ON COLUMN products.is_available IS 'Soft toggle — set false instead of deleting';
COMMENT ON COLUMN products.display_order IS 'Lower numbers appear first in the customer catalog';

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
