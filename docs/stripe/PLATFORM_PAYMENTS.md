# Platform payments (MIN-LAUNCH)

## Model

- Customer pays via **Stripe Hosted Checkout**
- Funds go to the **platform** Stripe account (`STRIPE_SECRET_KEY`)
- Merchants do **not** have Stripe Connect accounts
- Admin marks orders **settled** after paying merchants offline (bank transfer)

## Environment

**Production / local must use platform mode** (merchants never connect Stripe):

```env
ENABLE_STRIPE_CONNECT=false   # required for MIN-LAUNCH — or omit entirely
STRIPE_SECRET_KEY=sk_test_...   # platform account only
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

If `ENABLE_STRIPE_CONNECT=true`, merchants may see legacy Connect onboarding — do not set in production.

## Order payment lifecycle (card)

| Stage | `payment_status` | `paid_at` | `merchant_settled_at` |
|-------|-------------------|-----------|-------------------------|
| Order created, awaiting pay | `requires_payment` | null | null |
| Stripe webhook success | `paid` | set | null |
| Admin paid merchant offline | `paid` | set | set |

COD orders: `payment_method` and `payment_status` stay **NULL**.

## Merchant

1. `/merchant/payments` — toggle **Online kartla sipariş al** (no Stripe account linking)
2. View pending settlement total (sum of paid, unsettled card orders)
3. `/connect` redirects to `/merchant/payments` (legacy URL)

## Admin

1. `/admin/finance` — pending settlements by merchant and order
2. **Ödendi işaretle** — sets `merchant_settled_at`

## Migrations

- `00044` — payment columns on orders (still used)
- `00045` — `merchants.accepts_online_payment`
- `00046` — `paid_at`, `merchant_settled_at`

## Disabled when Connect is off

- `/connect` → redirects to `/merchant/payments`
- `/api/stripe/connect/*` → 403 `STRIPE_CONNECT_DISABLED`
- No `transfer_data`, `application_fee_amount`, or destination charges

## Future: re-enable Connect

Set `ENABLE_STRIPE_CONNECT=true` and restore Connect onboarding flows (code paths remain guarded).
