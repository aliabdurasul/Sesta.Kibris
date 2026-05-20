-- Migration: 00019_production_stabilization
-- Guest checkout, merchant min order, align optional columns.

-- Guest orders: customer_id nullable
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone text;

COMMENT ON COLUMN orders.guest_name IS 'Guest checkout — full name when customer_id IS NULL';
COMMENT ON COLUMN orders.guest_phone IS 'Guest checkout — phone when customer_id IS NULL';

-- Merchant minimum order (used by create-order Edge Function)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS minimum_order_amount integer
  CHECK (minimum_order_amount IS NULL OR minimum_order_amount > 0);

-- Ensure seed merchants have user_id populated (idempotent)
UPDATE merchants SET user_id = owner_user_id WHERE user_id IS NULL;

-- Guest / system status log entries may have no auth user
ALTER TABLE order_status_log ALTER COLUMN actor_id DROP NOT NULL;
