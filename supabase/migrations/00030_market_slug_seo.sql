-- Migration: 00030_market_slug_seo
-- Clean SEO slugs + legacy redirect aliases for /merchants/* → /market/*

CREATE TABLE IF NOT EXISTS merchant_slug_redirects (
  old_slug    text        PRIMARY KEY,
  merchant_id uuid        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE merchant_slug_redirects IS
  '301 source slugs after slug cleanup; old_slug never reused as primary slug';

CREATE INDEX IF NOT EXISTS idx_merchant_slug_redirects_merchant_id
  ON merchant_slug_redirects (merchant_id);

-- RLS: public read for anon redirect resolution (slug only, no PII)
ALTER TABLE merchant_slug_redirects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchant_slug_redirects_public_read ON merchant_slug_redirects;
CREATE POLICY merchant_slug_redirects_public_read ON merchant_slug_redirects
  FOR SELECT
  USING (true);

-- One-time slug backfill (Turkish-aware slugify in plpgsql)
DROP TRIGGER IF EXISTS trg_merchants_slug_immutable ON merchants;

CREATE OR REPLACE FUNCTION public.slugify_market_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text;
BEGIN
  s := lower(trim(p_name));
  s := translate(s,
    E'çğıöşüÇĞİÖŞÜ',
    E'cgiosucgiosu');
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '-+', '-', 'g');
  s := trim(both '-' from s);
  IF s = '' THEN
    s := 'market';
  END IF;
  RETURN s;
END;
$$;

CREATE OR REPLACE FUNCTION public.strip_legacy_slug_suffix(p_slug text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  m text[];
BEGIN
  m := regexp_match(p_slug, '^(.+)-[a-z0-9]{6,12}$');
  IF m IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN trim(both '-' from m[1]);
END;
$$;

DO $$
DECLARE
  r record;
  new_slug text;
  stripped text;
  candidate text;
  taken_slugs text[];
  n int;
  final_slug text;
BEGIN
  taken_slugs := ARRAY(SELECT slug FROM merchants);

  FOR r IN SELECT id, name, slug FROM merchants ORDER BY created_at LOOP
    new_slug := public.slugify_market_name(r.name);
    stripped := public.strip_legacy_slug_suffix(r.slug);

    IF stripped IS NOT NULL AND length(stripped) > 0 THEN
      candidate := stripped;
    ELSE
      candidate := new_slug;
    END IF;

    final_slug := candidate;
    IF final_slug = ANY(taken_slugs) AND final_slug <> r.slug THEN
      n := 1;
      LOOP
        final_slug := candidate || '-' || n::text;
        EXIT WHEN NOT (final_slug = ANY(taken_slugs)) OR final_slug = r.slug;
        n := n + 1;
      END LOOP;
    END IF;

    IF final_slug IS DISTINCT FROM r.slug THEN
      INSERT INTO merchant_slug_redirects (old_slug, merchant_id)
      VALUES (r.slug, r.id)
      ON CONFLICT (old_slug) DO NOTHING;

      taken_slugs := array_remove(taken_slugs, r.slug);
      UPDATE merchants SET slug = final_slug WHERE id = r.id;
      taken_slugs := taken_slugs || final_slug;
    END IF;
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.strip_legacy_slug_suffix(text);
DROP FUNCTION IF EXISTS public.slugify_market_name(text);

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
