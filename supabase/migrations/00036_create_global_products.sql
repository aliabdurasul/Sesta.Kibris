-- Migration: 00036_create_global_products
-- Shared product catalog. Admin creates & approves products.
-- Merchants attach products via merchant_inventory (migration 00037).
-- Barcode/EAN column is deferred to a future phase.

CREATE TABLE IF NOT EXISTS global_products (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        uuid        REFERENCES product_categories(id) ON DELETE SET NULL,
  name               text        NOT NULL,
  name_tr            text,                               -- localised Turkish display name
  slug               text        NOT NULL UNIQUE,        -- Turkish-aware URL slug (see slugify fn in 00030)
  description        text,
  brand              text,
  -- barcode / EAN-13 : reserved for future phase
  unit               text        NOT NULL,               -- "1L" | "kg" | "adet" | "500g" …
  variant_group_id   uuid,                               -- groups product variants; references another global_products.id (no FK — avoids self-ref complexity)
  image_url          text,                               -- primary image CDN url (mirrored from image_urls[is_primary])
  image_urls         jsonb       NOT NULL DEFAULT '[]',  -- [{url, label, is_primary}]
  tags               text[]      NOT NULL DEFAULT '{}',  -- free-text search helpers
  is_active          boolean     NOT NULL DEFAULT true,
  approved_by        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at        timestamptz,
  created_by         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  from_suggestion_id uuid,                               -- set when product is promoted from product_suggestions; no FK (circular dep)
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE global_products IS 'Shared product catalog. Admin creates/approves. Merchants attach via merchant_inventory.';
COMMENT ON COLUMN global_products.slug IS 'URL-safe identifier derived from name + unit. Immutable once published — changing breaks SEO URLs.';
COMMENT ON COLUMN global_products.unit IS 'Canonical unit: "1L", "500ml", "kg", "adet", "koli", "200g", "19L" etc.';
COMMENT ON COLUMN global_products.image_urls IS 'JSON array: [{url: string, label: string, is_primary: boolean}]. Primary url also mirrored to image_url column.';
COMMENT ON COLUMN global_products.variant_group_id IS 'Groups variants of the same product (e.g. 500ml / 1L / 2L of same brand). App-managed — no DB FK.';
COMMENT ON COLUMN global_products.from_suggestion_id IS 'References product_suggestions.id when this product was promoted from an approved merchant suggestion.';

-- ── updated_at trigger ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS global_products_updated_at ON global_products;
CREATE TRIGGER global_products_updated_at
  BEFORE UPDATE ON global_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Storefront: filter by category + active state
CREATE INDEX IF NOT EXISTS idx_global_products_category_active
  ON global_products(category_id, created_at DESC)
  WHERE is_active;

-- Product slug lookup (SEO URLs)
CREATE INDEX IF NOT EXISTS idx_global_products_slug
  ON global_products(slug);

-- General list/admin with ordering
CREATE INDEX IF NOT EXISTS idx_global_products_created_at
  ON global_products(created_at DESC);

-- Brand filter
CREATE INDEX IF NOT EXISTS idx_global_products_brand
  ON global_products(brand)
  WHERE brand IS NOT NULL;

-- pg_trgm fuzzy search on normalised name (Turkish-safe: lower + unaccent)
CREATE INDEX IF NOT EXISTS idx_global_products_name_trgm
  ON global_products
  USING gin (lower(name) gin_trgm_ops);

-- GIN index on tags array
CREATE INDEX IF NOT EXISTS idx_global_products_tags
  ON global_products
  USING gin(tags);

-- display_order helper column (used by merchant_inventory for storefront sort)
-- Not stored here — display_order lives on merchant_inventory per merchant.

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE global_products ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated): active products only
DROP POLICY IF EXISTS global_products_public_read ON global_products;
CREATE POLICY global_products_public_read ON global_products
  FOR SELECT
  USING (is_active = true);

-- Admin: full access — USING (admin) OR (is_active) → admin sees ALL rows including inactive
DROP POLICY IF EXISTS global_products_admin_all ON global_products;
CREATE POLICY global_products_admin_all ON global_products
  FOR ALL
  TO authenticated
  USING     (public.user_has_role('admin'))
  WITH CHECK (public.user_has_role('admin'));

-- ── Storage: product-images bucket ───────────────────────────────────────────
-- Path conventions:
--   Product images   : product-images/{product_id}/main.webp
--   Additional imgs  : product-images/{product_id}/{label}.webp
--   Category icons   : product-images/categories/{slug}.png
--   Suggestion imgs  : product-images/suggestions/{suggestion_id}/main.webp

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read (all objects in this bucket)
DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
CREATE POLICY product_images_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin: insert / update / delete
DROP POLICY IF EXISTS product_images_admin_insert ON storage.objects;
CREATE POLICY product_images_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.user_has_role('admin')
  );

DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
CREATE POLICY product_images_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.user_has_role('admin')
  );

DROP POLICY IF EXISTS product_images_admin_delete ON storage.objects;
CREATE POLICY product_images_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.user_has_role('admin')
  );
