-- Migration: 00006_create_orders
-- The central order entity linking all actors

CREATE TABLE IF NOT EXISTS orders (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       uuid        NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
  customer_id       uuid        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  courier_id        uuid        REFERENCES couriers(id) ON DELETE SET NULL,
  status            text        NOT NULL DEFAULT 'PENDING'
                                CHECK (status IN (
                                  'PENDING', 'CONFIRMED', 'REJECTED',
                                  'READY', 'ASSIGNED', 'IN_TRANSIT',
                                  'DELIVERED', 'FAILED_DELIVERY', 'CANCELLED'
                                )),
  total_amount      integer     NOT NULL CHECK (total_amount > 0),
  delivery_address  jsonb       NOT NULL,  -- snapshot at order creation time
  customer_notes    text,
  merchant_notes    text,
  rejection_reason  text,
  failure_reason    text,
  -- lifecycle timestamps — all set server-side via now()
  created_at        timestamptz NOT NULL DEFAULT now(),
  accepted_at       timestamptz,
  ready_at          timestamptz,
  assigned_at       timestamptz,
  picked_up_at      timestamptz,
  delivered_at      timestamptz
);

COMMENT ON TABLE orders IS 'Central order entity — state machine controlled by Edge Functions only';
COMMENT ON COLUMN orders.delivery_address IS 'JSONB snapshot of address at order time — never a FK';
COMMENT ON COLUMN orders.total_amount IS 'Calculated server-side — never trusted from client';
COMMENT ON COLUMN orders.status IS 'State machine: PENDING→CONFIRMED→READY→ASSIGNED→IN_TRANSIT→DELIVERED (or terminal: REJECTED/CANCELLED)';
