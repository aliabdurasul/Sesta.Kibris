-- Migration 00044: Stripe Connect MVP (not full GRANITE ledger)
-- Maps merchants to Stripe Connect v2 accounts and stores payment fields on orders.

-- Merchant ↔ Stripe Connect account (one connected account per merchant)
CREATE TABLE IF NOT EXISTS merchant_stripe_accounts (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id        uuid        NOT NULL UNIQUE REFERENCES merchants(id) ON DELETE CASCADE,
  user_id            uuid        NOT NULL,
  stripe_account_id  text        NOT NULL UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE merchant_stripe_accounts IS
  'Stripe Connect v2 account id per merchant — created via Accounts v2 API';

-- Platform catalog items mirrored in Stripe (MVP demo + future catalog sync)
CREATE TABLE IF NOT EXISTS stripe_products (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id        uuid        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  stripe_product_id  text        NOT NULL,
  stripe_price_id    text        NOT NULL,
  name               text        NOT NULL,
  description        text,
  unit_amount        integer     NOT NULL CHECK (unit_amount > 0),
  currency           text        NOT NULL DEFAULT 'try',
  inventory_id       uuid        REFERENCES merchant_inventory(id) ON DELETE SET NULL,
  is_active          boolean     NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_products_merchant ON stripe_products(merchant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_products_price ON stripe_products(stripe_price_id);

-- Order payment columns (COD rows keep payment_method = cod, payment_status NULL)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text
    CHECK (payment_method IS NULL OR payment_method IN ('cod', 'card')),
  ADD COLUMN IF NOT EXISTS payment_status text
    CHECK (
      payment_status IS NULL
      OR payment_status IN (
        'requires_payment',
        'paid',
        'failed',
        'refunded',
        'canceled'
      )
    ),
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS commission_amount integer
    CHECK (commission_amount IS NULL OR commission_amount >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session
  ON orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_pi
  ON orders(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Webhook idempotency log (MVP — full GRANITE will extend this)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text        NOT NULL UNIQUE,
  event_type      text        NOT NULL,
  processed_at    timestamptz,
  last_error      text,
  payload         jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_unprocessed
  ON stripe_webhook_events(created_at)
  WHERE processed_at IS NULL;

-- RLS: merchants read own stripe mapping; writes via service role only
ALTER TABLE merchant_stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY merchant_stripe_accounts_select_own ON merchant_stripe_accounts
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM merchants
      WHERE user_id = auth.uid() OR owner_user_id = auth.uid()
    )
  );

CREATE POLICY stripe_products_select_public ON stripe_products
  FOR SELECT
  USING (is_active = true);
