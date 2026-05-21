-- Migration: 00025_order_states_pickup
-- Add PICKED_UP to order status machine

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'PENDING', 'CONFIRMED', 'REJECTED',
    'READY', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT',
    'DELIVERED', 'FAILED_DELIVERY', 'CANCELLED'
  ));

COMMENT ON COLUMN orders.status IS
  'PENDING→CONFIRMED→READY→ASSIGNED→PICKED_UP→IN_TRANSIT→DELIVERED';
