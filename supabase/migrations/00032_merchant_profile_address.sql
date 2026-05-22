-- Migration: 00032_merchant_profile_address
-- Public storefront address (merchant profile); admin `address` stays internal.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS profile_address text;

COMMENT ON COLUMN merchants.profile_address IS
  'Merchant-edited address shown on /market/[slug]; admin address is not public';
