# Stripe Connect MVP — Architecture Summary

## Purpose

Minimum launch payment foundation for SestaKıbrıs without the full GRANITE financial engine.

## Money flow (MVP)

```
Customer → Stripe Hosted Checkout
         → PaymentIntent (destination charge)
         → Platform application_fee (10%)
         → Remainder → Merchant Connect account (automatic)
```

COD orders are unchanged (`payment_method = cod`, `payment_status` NULL).

## Folder map

| Path | Role |
|------|------|
| `src/lib/stripe/client.ts` | Server Stripe singleton |
| `src/lib/stripe/env.ts` | Env validation with helpful errors |
| `src/lib/stripe/connect.ts` | Accounts v2 create + status + onboarding links |
| `src/lib/stripe/checkout.ts` | Hosted Checkout sessions |
| `src/lib/stripe/webhooks.ts` | Event handlers + order payment_status |
| `src/app/api/stripe/*` | HTTP API |
| `src/app/connect` | Merchant onboarding UI |
| `src/app/storefront` | MVP product catalog |
| `supabase/migrations/00044_*` | DB tables + order payment columns |

## Database

- `merchant_stripe_accounts` — `merchant_id` ↔ Stripe account id
- `stripe_products` — catalog for MVP storefront
- `stripe_webhook_events` — idempotent webhook log
- `orders` — `payment_method`, `payment_status`, Stripe ids, `commission_amount`

## Webhook events handled

- `checkout.session.completed`
- `payment_intent.succeeded` / `payment_intent.payment_failed`
- `account.updated` (logged)

## Security

- Secret keys server-only
- Webhook signature required
- Amounts computed server-side
- Connect status always fetched live from Stripe
