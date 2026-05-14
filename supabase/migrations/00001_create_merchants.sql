-- Migration: 00001_create_merchants
-- Creates the merchants table — the root tenant entity

CREATE TABLE IF NOT EXISTS merchants (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text        NOT NULL,
  slug                   text        NOT NULL UNIQUE,
  category               text        NOT NULL CHECK (category IN ('grocery', 'water', 'gas')),
  owner_user_id          uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  is_active              boolean     NOT NULL DEFAULT true,
  is_open                boolean     NOT NULL DEFAULT false,
  address                text        NOT NULL,
  phone                  text        NOT NULL,
  order_timeout_minutes  integer     NOT NULL DEFAULT 15 CHECK (order_timeout_minutes > 0),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE merchants IS 'Merchant accounts — the root entity for all tenant data';
COMMENT ON COLUMN merchants.slug IS 'URL-safe identifier used in storefront paths';
COMMENT ON COLUMN merchants.category IS 'grocery | water | gas';
COMMENT ON COLUMN merchants.is_open IS 'Merchant-controlled real-time availability toggle';
COMMENT ON COLUMN merchants.order_timeout_minutes IS 'Minutes before PENDING order is flagged as timed out';

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
