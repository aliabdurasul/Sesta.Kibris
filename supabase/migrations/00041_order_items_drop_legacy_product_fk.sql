-- Migration: 00041_order_items_drop_legacy_product_fk
--
-- Root cause of "Sipariş kalemleri oluşturulamadı":
--   order_items.product_id FK still referenced legacy_merchant_products (renamed
--   from products in 00039). New checkout inserts merchant_inventory.id values
--   which do not exist in legacy_merchant_products → FK violation 23503.
--
-- Fix: drop FK. product_name / unit_price / line_total are authoritative snapshots.
-- product_id retains semantic reference for display resolution:
--   legacy orders → legacy_merchant_products.id
--   catalog orders → merchant_inventory.id

ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

COMMENT ON COLUMN order_items.product_id IS
  'Snapshot inventory reference. Legacy: legacy_merchant_products.id. '
  'Catalog era: merchant_inventory.id. Not FK-enforced after migration 00041.';
