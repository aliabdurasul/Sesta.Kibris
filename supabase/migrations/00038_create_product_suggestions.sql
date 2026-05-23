-- Migration: 00038_create_product_suggestions
-- Merchants submit suggestions for products not yet in global_products.
-- A DB trigger auto-runs pg_trgm similarity on INSERT and:
--   • Populates similarity_score (0.000–1.000)
--   • Sets duplicate_of + status='DUPLICATE' if similarity >= 0.80
-- Admin reviews via /admin/catalog/suggestions.
-- Rate limit: 5 new suggestions per merchant per day (enforced by trigger).

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_suggestions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       uuid        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  submitted_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status            text        NOT NULL DEFAULT 'PENDING'
                                CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DUPLICATE')),

  -- Merchant-supplied product data
  name              text        NOT NULL,
  description       text,
  brand             text,
  unit              text        NOT NULL,
  category_hint     text,        -- free-text category name hint from merchant
  image_url         text,        -- temporary upload: product-images/suggestions/{id}/main.webp
  merchant_notes    text,        -- message to admin

  -- Auto-computed on INSERT by check_suggestion_similarity() trigger
  similarity_score  numeric(4,3),                        -- 0.000–1.000 vs best match
  duplicate_of      uuid        REFERENCES global_products(id) ON DELETE SET NULL,

  -- Admin review
  admin_notes       text,
  reviewed_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,

  -- Set on APPROVED — links suggestion back to the created global product
  global_product_id uuid        REFERENCES global_products(id) ON DELETE SET NULL,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE product_suggestions IS 'Merchant-submitted product suggestions pending admin review and approval.';
COMMENT ON COLUMN product_suggestions.similarity_score IS 'pg_trgm similarity (0–1) vs best matching global_products name. Auto-set on INSERT.';
COMMENT ON COLUMN product_suggestions.duplicate_of IS 'Set when similarity_score >= 0.80. Points to the most similar existing global product.';
COMMENT ON COLUMN product_suggestions.status IS 'PENDING → UNDER_REVIEW → APPROVED | REJECTED | DUPLICATE';
COMMENT ON COLUMN product_suggestions.global_product_id IS 'Set to the newly created global_products.id on APPROVED. Merchant uses this to attach the product.';

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE TRIGGER product_suggestions_updated_at
  BEFORE UPDATE ON product_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Admin queue: PENDING first
CREATE INDEX IF NOT EXISTS idx_product_suggestions_status
  ON product_suggestions(status, created_at DESC)
  WHERE status = 'PENDING';

-- Merchant view: own suggestions
CREATE INDEX IF NOT EXISTS idx_product_suggestions_merchant
  ON product_suggestions(merchant_id, created_at DESC);

-- Similarity lookups
CREATE INDEX IF NOT EXISTS idx_product_suggestions_similarity
  ON product_suggestions(similarity_score DESC)
  WHERE similarity_score IS NOT NULL;

-- ── Similarity auto-check trigger ────────────────────────────────────────────
-- Runs BEFORE INSERT on product_suggestions.
-- 1. Computes pg_trgm similarity between the submitted name and all active global products.
-- 2. Stores the best score in similarity_score.
-- 3. If score >= 0.80: sets duplicate_of + status = 'DUPLICATE'.
-- 4. Rate-limits: max 5 suggestions per merchant per calendar day.
-- Uses unaccent(lower(…)) for Turkish character normalisation.

CREATE OR REPLACE FUNCTION check_suggestion_similarity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_best_id    uuid;
  v_best_score numeric(4,3);
  v_today_count integer;
BEGIN
  -- ── 1. Rate limit ─────────────────────────────────────────────────────────
  SELECT COUNT(*) INTO v_today_count
  FROM product_suggestions
  WHERE merchant_id = NEW.merchant_id
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  IF v_today_count >= 5 THEN
    RAISE EXCEPTION
      'SUGGESTION_RATE_LIMIT: Maximum 5 suggestions per day reached for this merchant.'
      USING ERRCODE = 'P0001';
  END IF;

  -- ── 2. Similarity check (only if global_products has rows) ────────────────
  SELECT
    id,
    similarity(
      unaccent(lower(name)),
      unaccent(lower(NEW.name))
    ) AS score
  INTO v_best_id, v_best_score
  FROM global_products
  WHERE is_active = true
  ORDER BY score DESC
  LIMIT 1;

  -- Store score even if below threshold
  IF v_best_score IS NOT NULL THEN
    NEW.similarity_score := v_best_score;
  END IF;

  -- ── 3. Auto-flag duplicates ───────────────────────────────────────────────
  IF v_best_score >= 0.80 THEN
    NEW.duplicate_of := v_best_id;
    NEW.status       := 'DUPLICATE';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_suggestion_similarity ON product_suggestions;
CREATE TRIGGER trg_suggestion_similarity
  BEFORE INSERT ON product_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION check_suggestion_similarity();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE product_suggestions ENABLE ROW LEVEL SECURITY;

-- Merchant: INSERT own suggestions + SELECT own suggestions
DROP POLICY IF EXISTS product_suggestions_merchant_insert ON product_suggestions;
CREATE POLICY product_suggestions_merchant_insert ON product_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_role('merchant')
    AND merchant_id = public.user_merchant_id()
    AND submitted_by = auth.uid()
  );

DROP POLICY IF EXISTS product_suggestions_merchant_select ON product_suggestions;
CREATE POLICY product_suggestions_merchant_select ON product_suggestions
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_role('merchant')
    AND merchant_id = public.user_merchant_id()
  );

-- Admin: full access
DROP POLICY IF EXISTS product_suggestions_admin_all ON product_suggestions;
CREATE POLICY product_suggestions_admin_all ON product_suggestions
  FOR ALL
  TO authenticated
  USING     (public.user_has_role('admin'))
  WITH CHECK (public.user_has_role('admin'));
