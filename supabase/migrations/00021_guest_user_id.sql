-- Guest checkout traceability: guest_user_id on orders (cookie-backed, not auth.users)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_user_id uuid;

COMMENT ON COLUMN orders.guest_user_id IS
  'Anonymous checkout id from guest_user_id cookie — set when customer_id IS NULL';

-- Backfill legacy guest rows (guest_name without guest_user_id)
UPDATE orders
SET guest_user_id = gen_random_uuid()
WHERE customer_id IS NULL
  AND guest_user_id IS NULL;

-- At least one identity must be present
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_or_guest_check;
ALTER TABLE orders ADD CONSTRAINT orders_customer_or_guest_check
  CHECK (customer_id IS NOT NULL OR guest_user_id IS NOT NULL);
