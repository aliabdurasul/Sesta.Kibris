-- Migration: 00031_merchant_profile_onboarding
-- Merchant-editable profile fields + rollout flags (hybrid onboarding)

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb,
  ADD COLUMN IF NOT EXISTS delivery_time_min integer,
  ADD COLUMN IF NOT EXISTS delivery_time_max integer,
  ADD COLUMN IF NOT EXISTS delivery_fee integer,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_demo_market boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_by_merchant boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

COMMENT ON COLUMN merchants.logo_url IS 'Public logo URL (Supabase Storage merchant-assets)';
COMMENT ON COLUMN merchants.cover_image_url IS 'Public cover/banner URL';
COMMENT ON COLUMN merchants.opening_hours IS 'JSON: mon..sun with open/close HH:MM';
COMMENT ON COLUMN merchants.delivery_fee IS 'Delivery fee in kuruş; NULL = not set';
COMMENT ON COLUMN merchants.is_demo_market IS 'Legacy/seed markets using system visual fallbacks';
COMMENT ON COLUMN merchants.is_onboarded IS 'Merchant completed onboarding checklist';

-- Seed merchants: mark as demo (non-destructive)
UPDATE merchants
SET is_demo_market = true
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

-- ============================================================
-- Storage: merchant-assets bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-assets',
  'merchant-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
DROP POLICY IF EXISTS merchant_assets_public_read ON storage.objects;
CREATE POLICY merchant_assets_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'merchant-assets');

-- Merchant upload/update/delete own folder {merchant_id}/*
DROP POLICY IF EXISTS merchant_assets_merchant_insert ON storage.objects;
CREATE POLICY merchant_assets_merchant_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'merchant-assets'
    AND (storage.foldername(name))[1] = public.user_merchant_id()::text
  );

DROP POLICY IF EXISTS merchant_assets_merchant_update ON storage.objects;
CREATE POLICY merchant_assets_merchant_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'merchant-assets'
    AND (storage.foldername(name))[1] = public.user_merchant_id()::text
  );

DROP POLICY IF EXISTS merchant_assets_merchant_delete ON storage.objects;
CREATE POLICY merchant_assets_merchant_delete ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'merchant-assets'
    AND (storage.foldername(name))[1] = public.user_merchant_id()::text
  );
