# Stripe Connect MVP — Local Testing

## Prerequisites

1. Apply migrations `00044_stripe_connect_mvp.sql` and `00045_merchant_accepts_online_payment.sql` to your Supabase project.
2. Fill `.env.local` (see `.env.example`).
3. Install Stripe CLI: `winget install Stripe.StripeCli`

## Environment

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from stripe listen output
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Terminal 1 — App

```powershell
pnpm dev
```

## Terminal 2 — Webhooks

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

Copy the `whsec_...` line into `STRIPE_WEBHOOK_SECRET`, then restart `pnpm dev`.

## Test flow — real marketplace checkout (recommended)

1. Log in as **merchant** → `/merchant/payments` → **Stripe Bağla** → complete onboarding → enable **Kartla ödeme**.
2. Open `/market/[slug]` → add products to cart → `/checkout`.
3. Select **Kredi / Banka Kartı** → enter address → **Kartla Öde**.
4. On Stripe Hosted Checkout pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. Land on `/success` — verify in Supabase: `payment_method = card`, `payment_status = paid`, `orders.status = PENDING`.
6. Test **COD**: same checkout with **Kapıda Nakit** — `POST /api/orders/create`, `payment_status` stays NULL.

## Test flow — demo storefront (optional)

1. Merchant: `/connect` onboarding (same as above).
2. `POST /api/stripe/products/create` with `{ "name": "Test", "unit_amount": 4500 }`.
3. `/storefront` → **Satın al** → test card `4242 4242 4242 4242`.

## Trigger test events

```powershell
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

## Admin observability

- `/admin/finance` — connected merchants, recent card payments, platform fee estimate, failures.
- `/admin/stripe` — webhook event log (technical).

## MVP limitations

- **Not** full GRANITE ledger / reconciliation.
- Destination charges (instant transfer split) — not delayed payout on `DELIVERED`.
- Real checkout at `/checkout` supports COD + card when merchant enabled; `/storefront` remains a separate demo catalog.

## Future GRANITE migration

When adding ledger: keep `merchant_stripe_accounts` and payment columns; add `ledger_*` tables and switch from destination charges to separate charges + transfer on delivery behind a feature flag.
