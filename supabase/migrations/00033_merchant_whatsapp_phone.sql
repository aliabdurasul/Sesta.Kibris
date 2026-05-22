-- Migration: 00033_merchant_whatsapp_phone
-- Merchant WhatsApp contact (shown on /market/[slug] only)

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS whatsapp_phone text;

COMMENT ON COLUMN merchants.whatsapp_phone IS
  'Merchant WhatsApp number; public on store page, wa.me link';
