-- Migration: 00028_phase1_stabilization
-- Guest order logs + catalog recovery after bad seed/data ops

-- Guest checkout: actor_id may be unknown (not in auth.users)
ALTER TABLE order_status_log
  ALTER COLUMN actor_id DROP NOT NULL;

COMMENT ON COLUMN order_status_log.actor_role IS
  'customer | merchant | courier | admin | guest';

-- Recover platform visibility (idempotent; does not delete rows)
UPDATE merchants
SET is_active = true
WHERE user_id IS NOT NULL
  AND is_active = false;

UPDATE products p
SET is_available = true
FROM merchants m
WHERE p.merchant_id = m.id
  AND m.is_active = true
  AND p.is_available = false;
