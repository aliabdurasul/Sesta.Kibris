-- Migration: 00029_delivery_model_phase2
-- Merchant-owned delivery: default courier + HYBRID platform escalation

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS default_courier_id uuid
  REFERENCES couriers(id) ON DELETE SET NULL;

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS hybrid_assign_timeout_minutes integer
  NOT NULL DEFAULT 15 CHECK (hybrid_assign_timeout_minutes > 0);

COMMENT ON COLUMN merchants.default_courier_id IS
  'MERCHANT_DELIVERY / HYBRID: auto-assign when merchant dispatches without selection';
COMMENT ON COLUMN merchants.hybrid_assign_timeout_minutes IS
  'HYBRID: minutes after ready_at before admin may assign platform courier';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS assignment_escalated_at timestamptz;

COMMENT ON COLUMN orders.assignment_escalated_at IS
  'HYBRID: set when merchant window expired — admin platform assign allowed';

COMMENT ON COLUMN orders.status IS
  'PENDING(created)→CONFIRMED→READY→ASSIGNED→PICKED_UP→IN_TRANSIT→DELIVERED';

-- Existing merchants with owner default to merchant-owned delivery
UPDATE merchants
SET delivery_mode = 'MERCHANT_DELIVERY'
WHERE user_id IS NOT NULL
  AND delivery_mode = 'PLATFORM_COURIER';
