-- Migration: 00043_guest_checkout_token
-- Guest checkout tracking via sk_guest_* token (localStorage), additive to guest_user_id cookie.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_token text;

COMMENT ON COLUMN orders.guest_token IS
  'Client-held sk_guest_* token for order tracking without login. Set when customer_id IS NULL.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_guest_token_unique
  ON orders (guest_token)
  WHERE guest_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_guest_token_lookup
  ON orders (guest_token, created_at DESC)
  WHERE guest_token IS NOT NULL AND customer_id IS NULL;

-- At least one identity: registered customer, guest token, or legacy guest_user_id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_or_guest_check;
ALTER TABLE orders ADD CONSTRAINT orders_customer_or_guest_check
  CHECK (
    customer_id IS NOT NULL
    OR guest_token IS NOT NULL
    OR guest_user_id IS NOT NULL
  );
