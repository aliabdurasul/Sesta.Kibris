-- Merchant opt-in for card checkout (requires Stripe Connect ready in app logic)
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS accepts_online_payment boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN merchants.accepts_online_payment IS
  'Merchant enabled card checkout; still requires Stripe Connect onboarding complete';
