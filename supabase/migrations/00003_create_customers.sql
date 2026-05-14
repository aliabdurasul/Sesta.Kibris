-- Migration: 00003_create_customers
-- Customer profiles — id matches auth.users.id

CREATE TABLE IF NOT EXISTS customers (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text        NOT NULL,
  phone      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE customers IS 'Customer profiles; id is FK to auth.users';
COMMENT ON COLUMN customers.id IS 'Same UUID as auth.users.id — no separate PK';
