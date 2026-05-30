-- Migration: 00047_homepage_promos
-- Admin-managed homepage promotional banners (MVP — no analytics).

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS homepage_promos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  subtitle    text,
  image_url   text        NOT NULL,
  market_id   uuid        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  cta_text    text        NOT NULL DEFAULT 'Keşfet',
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS homepage_promos_active_sort_idx
  ON homepage_promos (is_active, sort_order)
  WHERE is_active = true;

COMMENT ON TABLE homepage_promos IS 'Homepage promo slider — admin-managed, links to a market';
COMMENT ON COLUMN homepage_promos.image_url IS 'Public https URL from promo-banners storage bucket';
COMMENT ON COLUMN homepage_promos.starts_at IS 'NULL = no start constraint';
COMMENT ON COLUMN homepage_promos.ends_at IS 'NULL = no end constraint';

CREATE TRIGGER homepage_promos_updated_at
  BEFORE UPDATE ON homepage_promos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE homepage_promos ENABLE ROW LEVEL SECURITY;

-- Public: active promos within schedule, target market must be active
DROP POLICY IF EXISTS homepage_promos_select_public ON homepage_promos;
CREATE POLICY homepage_promos_select_public ON homepage_promos
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
    AND EXISTS (
      SELECT 1
      FROM merchants m
      WHERE m.id = homepage_promos.market_id
        AND m.is_active = true
    )
  );

-- Admin: full CRUD
DROP POLICY IF EXISTS homepage_promos_admin_all ON homepage_promos;
CREATE POLICY homepage_promos_admin_all ON homepage_promos
  FOR ALL
  TO authenticated
  USING (public.user_has_role('admin'))
  WITH CHECK (public.user_has_role('admin'));

-- ── Storage: promo-banners bucket ────────────────────────────────────────────
-- Path: promo-banners/{uuid}.{ext}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promo-banners',
  'promo-banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS promo_banners_public_read ON storage.objects;
CREATE POLICY promo_banners_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'promo-banners');

DROP POLICY IF EXISTS promo_banners_admin_insert ON storage.objects;
CREATE POLICY promo_banners_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'promo-banners'
    AND public.user_has_role('admin')
  );

DROP POLICY IF EXISTS promo_banners_admin_update ON storage.objects;
CREATE POLICY promo_banners_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'promo-banners'
    AND public.user_has_role('admin')
  );

DROP POLICY IF EXISTS promo_banners_admin_delete ON storage.objects;
CREATE POLICY promo_banners_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'promo-banners'
    AND public.user_has_role('admin')
  );
