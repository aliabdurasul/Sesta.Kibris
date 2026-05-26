# Stripe Connect MVP — Local Testing

## Prerequisites

1. Apply migration `00044_stripe_connect_mvp.sql` to your Supabase project.
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

## Test flow

1. Log in as **merchant** → open `/connect` → create account → complete onboarding.
2. `POST /api/stripe/products/create` (or add UI later) with `{ "name": "Test", "unit_amount": 4500 }`.
3. Open `/storefront` → **Satın al** → complete Checkout with test card `4242 4242 4242 4242`.
4. Land on `/success` — verify order `payment_status = paid` in Supabase.

## Trigger test events

```powershell
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

## Admin observability

`/admin/stripe` — connected merchants, recent card orders, webhook log rows.

## MVP limitations

- **Not** full GRANITE ledger / reconciliation.
- Destination charges (instant transfer split) — not delayed payout on `DELIVERED`.
- Demo storefront at `/storefront` — production market COD flow unchanged at `/market/[slug]`.

## Future GRANITE migration

When adding ledger: keep `merchant_stripe_accounts` and payment columns; add `ledger_*` tables and switch from destination charges to separate charges + transfer on delivery behind a feature flag.
