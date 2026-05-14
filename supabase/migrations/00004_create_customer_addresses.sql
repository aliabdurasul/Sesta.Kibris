-- Migration: 00004_create_customer_addresses
-- Saved delivery addresses for customers

CREATE TABLE IF NOT EXISTS customer_addresses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label        text        NOT NULL,         -- e.g. "Ev", "Is"
  address_line text        NOT NULL,
  district     text        NOT NULL,
  city         text        NOT NULL DEFAULT 'Lefkosa',
  notes        text,                         -- delivery instructions
  is_default   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE customer_addresses IS 'Saved delivery addresses per customer';
COMMENT ON COLUMN customer_addresses.label IS 'Human label, e.g. Ev, Is, Diger';
COMMENT ON COLUMN customer_addresses.city IS 'Defaults to Lefkosa for KKTC market';

-- Ensure only one default address per customer
CREATE UNIQUE INDEX customer_addresses_one_default
  ON customer_addresses (customer_id)
  WHERE is_default = true;
