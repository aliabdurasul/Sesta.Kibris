-- Migration: 00040_products_compat_view
-- Compatibility VIEW named `products` that approximates the old products table schema.
-- Allows existing code paths (merchant product page, order item resolvers) to keep
-- working without immediate refactoring after migration 00039 renames the table.
--
-- The VIEW is READ-ONLY. Any INSERT/UPDATE/DELETE on it will raise a clear error.
-- All writes must go directly to merchant_inventory or global_products.
--
-- Columns mirrored from old products table:
--   id            → merchant_inventory.id  (inventory row id, not product id)
--   merchant_id   → merchant_inventory.merchant_id
--   name          → global_products.name
--   description   → global_products.description
--   price         → merchant_inventory.price
--   unit          → global_products.unit
--   stock_count   → merchant_inventory.stock_count
--   is_available  → merchant_inventory.is_available
--   image_url     → global_products.image_url
--   display_order → merchant_inventory.display_order
--   created_at    → merchant_inventory.attached_at  (closest semantic equivalent)
--   updated_at    → merchant_inventory.updated_at
--
-- Additional columns exposed (not in old schema — safe for new code to use):
--   product_id    → global_products.id
--   category_id   → global_products.category_id
--   brand         → global_products.brand
--   slug          → global_products.slug
--   tags          → global_products.tags

CREATE OR REPLACE VIEW products AS
SELECT
  mi.id                           AS id,
  mi.merchant_id                  AS merchant_id,
  gp.id                           AS product_id,
  gp.name                         AS name,
  gp.description                  AS description,
  mi.price                        AS price,
  gp.unit                         AS unit,
  mi.stock_count                  AS stock_count,
  mi.is_available                 AS is_available,
  gp.image_url                    AS image_url,
  mi.display_order                AS display_order,
  mi.attached_at                  AS created_at,
  mi.updated_at                   AS updated_at,
  -- Bonus columns for new code
  gp.category_id                  AS category_id,
  gp.brand                        AS brand,
  gp.slug                         AS slug,
  gp.tags                         AS tags,
  gp.image_urls                   AS image_urls
FROM merchant_inventory mi
JOIN global_products gp ON gp.id = mi.product_id
WHERE gp.is_active = true;

COMMENT ON VIEW products IS
  'Backward-compat shim over merchant_inventory + global_products. '
  'READ-ONLY — all writes must target merchant_inventory or global_products directly. '
  'Deprecation target: remove once all code paths use the new tables (Phase 2).';

-- ── Write-guard rule ─────────────────────────────────────────────────────────
-- Raise a descriptive error on any DML through the view.

CREATE OR REPLACE RULE products_no_insert AS
  ON INSERT TO products
  DO INSTEAD (
    SELECT 1 / 0  -- raises division by zero; message overridden below
  );

-- PostgreSQL doesn't allow RAISE in rules; use a trigger-on-view instead.
DROP RULE IF EXISTS products_no_insert ON products;

CREATE OR REPLACE FUNCTION products_view_write_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'products view is read-only. Write to merchant_inventory or global_products directly.'
    USING ERRCODE = 'P0002';
END;
$$;

DROP TRIGGER IF EXISTS trg_products_no_insert ON products;
CREATE TRIGGER trg_products_no_insert
  INSTEAD OF INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_view_write_guard();

DROP TRIGGER IF EXISTS trg_products_no_update ON products;
CREATE TRIGGER trg_products_no_update
  INSTEAD OF UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_view_write_guard();

DROP TRIGGER IF EXISTS trg_products_no_delete ON products;
CREATE TRIGGER trg_products_no_delete
  INSTEAD OF DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_view_write_guard();
