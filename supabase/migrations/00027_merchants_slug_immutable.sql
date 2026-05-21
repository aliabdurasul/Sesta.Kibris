-- Migration: 00027_merchants_slug_immutable
-- Slug unique (already NOT NULL UNIQUE) + immutable after create

CREATE OR REPLACE FUNCTION public.prevent_merchant_slug_update()
RETURNS trigger AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    RAISE EXCEPTION 'merchant slug is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merchants_slug_immutable ON merchants;
CREATE TRIGGER trg_merchants_slug_immutable
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_merchant_slug_update();
