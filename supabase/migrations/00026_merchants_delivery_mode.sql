-- Migration: 00026_merchants_delivery_mode
-- How couriers are assigned per merchant

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS delivery_mode text NOT NULL DEFAULT 'PLATFORM_COURIER';

ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_delivery_mode_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_delivery_mode_check
  CHECK (delivery_mode IN ('MERCHANT_DELIVERY', 'PLATFORM_COURIER', 'HYBRID'));

COMMENT ON COLUMN merchants.delivery_mode IS
  'MERCHANT_DELIVERY: own couriers only | PLATFORM_COURIER: admin assigns | HYBRID: both';
