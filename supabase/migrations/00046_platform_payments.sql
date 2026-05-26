-- MIN-LAUNCH: platform collects all card payments; merchants settled offline by admin.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS merchant_settled_at timestamptz;

COMMENT ON COLUMN orders.paid_at IS
  'When Stripe confirmed card payment (webhook)';
COMMENT ON COLUMN orders.merchant_settled_at IS
  'When admin marked merchant as paid offline (NULL = pending settlement)';

CREATE INDEX IF NOT EXISTS idx_orders_pending_settlement
  ON orders(merchant_id, created_at)
  WHERE payment_method = 'card'
    AND payment_status = 'paid'
    AND merchant_settled_at IS NULL;
