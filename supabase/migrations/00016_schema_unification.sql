-- Migration: 00016_schema_unification
-- Additive migration that aligns the DB schema with the application code.
--
-- PROBLEM: Three tables had diverged between migrations and the app layer:
--
--   customers  — migration: id = auth.users.id (no user_id column)
--               app: queries .eq("user_id", userId) → returns nothing
--   merchants  — migration: owner_user_id FK
--               app: queries .eq("user_id", userId) → returns nothing
--   couriers   — migration: merchant_id NOT NULL
--               app: inserts without merchant_id → fails
--
-- STRATEGY: Additive only. Existing columns/indexes/FKs are kept.
-- No DROP. All changes are backward-compatible.
--
-- ============================================================
-- 1. CUSTOMERS — add user_id column (same value as id)
-- ============================================================

-- Add the column as nullable first so UPDATE can populate it
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id uuid
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- Populate from existing PK (customers.id IS the auth user UUID)
UPDATE customers SET user_id = id WHERE user_id IS NULL;

-- Now enforce NOT NULL — all rows are populated
ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL;

-- Enforce uniqueness to mirror PK semantics
CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_unique ON customers (user_id);

-- Make phone and full_name nullable so registration can succeed
-- even when these fields are provided later (e.g. social login)
ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN full_name DROP NOT NULL;

COMMENT ON COLUMN customers.user_id IS
  'FK to auth.users.id. Equal to id (canonical reference used by all app queries).';

-- ============================================================
-- 2. MERCHANTS — add user_id column (same value as owner_user_id)
-- ============================================================

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS user_id uuid
  REFERENCES auth.users(id) ON DELETE RESTRICT;

UPDATE merchants SET user_id = owner_user_id WHERE user_id IS NULL;

ALTER TABLE merchants ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS merchants_user_id_unique ON merchants (user_id);

COMMENT ON COLUMN merchants.user_id IS
  'FK to auth.users.id. Mirror of owner_user_id — canonical reference for app queries.';

-- ============================================================
-- 3. COURIERS — loosen merchant_id constraint; add missing columns
-- ============================================================

-- merchant_id NOT NULL was blocking admin-created platform couriers
-- (not attached to a specific merchant). Make nullable.
ALTER TABLE couriers ALTER COLUMN merchant_id DROP NOT NULL;

-- Add columns the app expects but migration never defined
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS vehicle_type text;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_couriers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS couriers_updated_at ON couriers;
CREATE TRIGGER couriers_updated_at
  BEFORE UPDATE ON couriers
  FOR EACH ROW
  EXECUTE FUNCTION update_couriers_updated_at();

COMMENT ON COLUMN couriers.merchant_id IS
  'Optional merchant association. NULL = platform-level courier.';
COMMENT ON COLUMN couriers.vehicle_type IS
  'Optional: motosiklet | bisiklet | araba | yaya';
COMMENT ON COLUMN couriers.is_available IS
  'Courier availability toggle. Default true on creation.';
