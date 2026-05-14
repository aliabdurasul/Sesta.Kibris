-- Migration: 00008_create_order_status_log
-- Append-only audit trail for every order state transition

CREATE TABLE IF NOT EXISTS order_status_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text,                  -- NULL for the initial PENDING entry
  to_status   text        NOT NULL,
  actor_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  actor_role  text        NOT NULL,  -- customer | merchant | courier | admin
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_status_log IS 'Append-only audit trail — no UPDATE or DELETE ever';
COMMENT ON COLUMN order_status_log.from_status IS 'NULL for the initial creation log entry';
COMMENT ON COLUMN order_status_log.actor_role IS 'customer | merchant | courier | admin';
