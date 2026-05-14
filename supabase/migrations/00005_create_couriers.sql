-- Migration: 00005_create_couriers
-- Couriers are created by and tied to a single merchant (Phase 1)

CREATE TABLE IF NOT EXISTS couriers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  full_name   text        NOT NULL,
  phone       text        NOT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE couriers IS 'Delivery personnel, owned by a specific merchant in Phase 1';
COMMENT ON COLUMN couriers.user_id IS 'Auth identity — UNIQUE so one user cannot be courier for multiple merchants';
