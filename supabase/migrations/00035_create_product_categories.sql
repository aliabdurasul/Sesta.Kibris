-- Migration: 00035_create_product_categories
-- Global product category tree. Admin-managed.
-- icon_url is populated post-launch via Admin UI (product-images/categories/{slug}.png).

CREATE TABLE IF NOT EXISTS product_categories (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL UNIQUE,
  slug          text        NOT NULL UNIQUE,
  parent_id     uuid        REFERENCES product_categories(id) ON DELETE SET NULL,
  icon_url      text,        -- CDN url: product-images/categories/{slug}.png — uploaded via Admin UI
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE product_categories IS 'Admin-managed category tree for global_products. Supports up to 2 levels (parent → child).';
COMMENT ON COLUMN product_categories.icon_url IS 'Category icon URL. Convention: product-images/categories/{slug}.png. NULL is valid — UI falls back to a generic icon.';
COMMENT ON COLUMN product_categories.parent_id IS 'NULL = top-level category. Non-null = sub-category under parent.';
COMMENT ON COLUMN product_categories.slug IS 'Turkish-aware URL-safe identifier. Immutable after first use in a product URL.';

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_product_categories_parent
  ON product_categories(parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_categories_display_order
  ON product_categories(display_order)
  WHERE is_active;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated): read active categories
DROP POLICY IF EXISTS product_categories_public_read ON product_categories;
CREATE POLICY product_categories_public_read ON product_categories
  FOR SELECT
  USING (is_active = true);

-- Admin: full access including inactive
DROP POLICY IF EXISTS product_categories_admin_all ON product_categories;
CREATE POLICY product_categories_admin_all ON product_categories
  FOR ALL
  TO authenticated
  USING     (public.user_has_role('admin'))
  WITH CHECK (public.user_has_role('admin'));

-- ── Seed: 12 top-level Cyprus grocery categories ──────────────────────────────
-- icon_url left NULL — uploaded by admin via /admin/catalog/categories UI.
-- display_order determines storefront sort. Adjust freely via Admin UI later.

INSERT INTO product_categories (name, slug, display_order) VALUES
  ('Süt & Yumurta',    'sut-yumurta',    1),
  ('Ekmek & Unlu',     'ekmek-unlu',     2),
  ('Et & Şarküteri',   'et-sarkuteri',   3),
  ('Meyve & Sebze',    'meyve-sebze',    4),
  ('Dondurulmuş',      'dondurulmus',    5),
  ('İçecekler',        'icecekler',      6),
  ('Temizlik',         'temizlik',       7),
  ('Kişisel Bakım',    'kisisel-bakim',  8),
  ('Kahvaltılık',      'kahvaltilik',    9),
  ('Bakliyat & Tahıl', 'bakliyat-tahil', 10),
  ('Atıştırmalık',     'atistirmalik',   11),
  ('Su & Gazlı',       'su-gazli',       12)
ON CONFLICT (slug) DO NOTHING;
