-- Migration: 00007_create_order_items
-- Line items — prices and names snapshotted at order creation

CREATE TABLE IF NOT EXISTS order_items (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid    NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name  text    NOT NULL,    -- snapshot — NOT a dynamic lookup
  unit_price    integer NOT NULL,    -- snapshot — price at the moment of order
  quantity      integer NOT NULL CHECK (quantity > 0),
  line_total    integer NOT NULL CHECK (line_total > 0)  -- unit_price * quantity
);

COMMENT ON TABLE order_items IS 'Order line items with snapshotted product data';
COMMENT ON COLUMN order_items.product_name IS 'Snapshot — if merchant renames product, history is preserved';
COMMENT ON COLUMN order_items.unit_price IS 'Snapshot — if merchant changes price, history is preserved';
COMMENT ON COLUMN order_items.line_total IS 'unit_price * quantity — calculated server-side';
