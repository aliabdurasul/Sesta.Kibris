# Phase 1.2.1 — Stripe Integration (Test → Production)
> **Sesta Kıbrıs**  
> File: `PHASE_1.2.1_STRIPE.md`  
> Dependency: Phase 3 (checkout UI), Phase 4 (Telegram for payment alerts)

---

## Goal
Reliable, secure payment processing. Test everything in sandbox first — never touch Production keys until all test scenarios pass. Two clearly separated sub-phases: 5.1 (Test) and 5.2 (Production).

---

# ─── PHASE 5.1 — STRIPE TEST MODE ───

## 5.1.1 — Account & Keys Setup

### 5.1.1.1 — Create / Access Stripe Account
- **What**: Ensure you have a Stripe account for Cyprus
- **URL**: https://dashboard.stripe.com
- **Note**: Cyprus is supported. Use EUR as primary currency.
- **Done When**: Stripe Dashboard accessible, account verified

### 5.1.1.2 — Configure Test Environment Variables
- **What**: Add test keys to `.env`

```env
# Stripe — TEST MODE (never commit real keys; copy from Stripe Dashboard)
STRIPE_PUBLISHABLE_KEY=<publishable_test_key>
STRIPE_SECRET_KEY=<secret_test_key>
STRIPE_WEBHOOK_SECRET=<webhook_signing_secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<publishable_test_key>
```

- **Where**: `.env.local` (gitignored), also add empty placeholders to `.env.example`
- **Done When**: Keys load correctly, `stripe.paymentIntents.list()` returns without auth error

### 5.1.1.3 — Install Stripe SDK
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

- **Done When**: `import Stripe from 'stripe'` works without errors

---

## 5.1.2 — Backend: Payment Intent

### 5.1.2.1 — Create Payment Intent Endpoint
- **What**: API route that creates a Stripe PaymentIntent
- **Where**: `app/api/payments/create-intent/route.ts`

```ts
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { orderId, amount, currency = 'eur' } = await req.json()

  // Validate order exists and belongs to current user
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses cents
    currency,
    metadata: { orderId, platform: 'sesta-kibris' },
    automatic_payment_methods: { enabled: true },
  })

  return Response.json({ clientSecret: paymentIntent.client_secret })
}
```

- **Done When**: POST to `/api/payments/create-intent` returns `clientSecret`

---

## 5.1.3 — Frontend: Payment Form

### 5.1.3.1 — Stripe Provider Setup
- **What**: Wrap payment step in Stripe Elements
- **Where**: `components/payment/StripeProvider.tsx`

```tsx
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function StripeProvider({ clientSecret, children }: Props) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: 'tr' }}>
      {children}
    </Elements>
  )
}
```

- **Done When**: No console errors about missing Stripe instance

### 5.1.3.2 — Payment Form Component
- **What**: Card input form using Stripe's prebuilt PaymentElement
- **Where**: `components/payment/CheckoutForm.tsx`

```tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

export function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/${orderId}/success`,
      },
    })

    if (error) {
      setError(error.message ?? 'Ödeme başarısız oldu.')
      setLoading(false)
    }
    // On success, Stripe redirects to return_url
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
      </button>
    </form>
  )
}
```

- **Done When**: Card form renders, test card `4242 4242 4242 4242` accepted

### 5.1.3.3 — Test Cards Reference
Use these during 5.1 testing (never in production):

| Scenario | Card Number | CVV | Date |
|----------|-------------|-----|------|
| Success | 4242 4242 4242 4242 | Any | Future |
| 3D Secure required | 4000 0025 0000 3155 | Any | Future |
| Declined | 4000 0000 0000 0002 | Any | Future |
| Insufficient funds | 4000 0000 0000 9995 | Any | Future |

- **Done When**: All 4 scenarios tested, correct behavior on each

---

## 5.1.4 — Webhook Handler

### 5.1.4.1 — Webhook Endpoint
- **What**: Receive Stripe events and update order status
- **Where**: `app/api/payments/webhook/route.ts`

```ts
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      await db.order.update({
        where: { id: pi.metadata.orderId },
        data: { paymentStatus: 'paid', stripePaymentIntentId: pi.id }
      })
      // → Trigger Telegram notification (Phase 4.2.2)
      await sendPaymentConfirmedAlert(pi.metadata.orderId)
      break
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await db.order.update({
        where: { id: pi.metadata.orderId },
        data: { paymentStatus: 'failed' }
      })
      break
    }
  }

  return new Response('OK', { status: 200 })
}
```

- **Done When**: Webhook receives events, order status updates in DB

### 5.1.4.2 — Local Webhook Testing with Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded
```

- **Done When**: Local webhook receives event, order updates in dev DB

---

## 5.1.5 — Test Scenario Checklist (Must All Pass)

```
[ ] 5.1.5.1 — Successful payment (card 4242) → order marked paid → Telegram alert sent
[ ] 5.1.5.2 — 3DS required → modal appears → user completes → order paid
[ ] 5.1.5.3 — Card declined → error message shown → order stays unpaid → user can retry
[ ] 5.1.5.4 — Insufficient funds → specific error message shown
[ ] 5.1.5.5 — Network timeout → no duplicate charge (idempotency check)
[ ] 5.1.5.6 — Webhook arrives out of order → handled gracefully (idempotent updates)
[ ] 5.1.5.7 — Order confirmation page shows after success
[ ] 5.1.5.8 — Admin receives Telegram payment alert
[ ] 5.1.5.9 — Stripe Dashboard shows test payment in Test Mode
```

**ALL 9 scenarios must pass before proceeding to 5.2.**

---

# ─── PHASE 5.2 — STRIPE PRODUCTION MODE ───

> ⚠️ **Do NOT start Phase 5.2 until Phase 5.1 checklist is 100% complete.**

## 5.2.1 — Production Account Verification

### 5.2.1.1 — Activate Stripe Account
- **What**: Complete Stripe's business verification
- **Required**: Business type, Cyprus business address, bank account (IBAN), ID verification
- **URL**: https://dashboard.stripe.com/account/onboarding
- **Done When**: Account status shows "Active" (not "Restricted")

### 5.2.1.2 — Business Configuration
- **What**: In Stripe Dashboard → Settings:
  - Statement descriptor: `SESTA KIBRIS` (appears on customer bank statements)
  - Support email: support@sesta.cy
  - Support phone: +357...
  - Currency: EUR
- **Done When**: Settings saved, test statement descriptor visible in test charge

---

## 5.2.2 — Production Keys

### 5.2.2.1 — Environment Switch
- **What**: Production environment uses live keys, staging uses test keys
- **Where**: Production `.env` on hosting platform (Vercel env vars, etc.)

```env
# Production ONLY — Never in .env.local, never in git
STRIPE_PUBLISHABLE_KEY=<publishable_live_key>
STRIPE_SECRET_KEY=<secret_live_key>
STRIPE_WEBHOOK_SECRET=<live_webhook_signing_secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<publishable_live_key>
```

- **Done When**: Production deployment uses `pk_live_` keys, dev still uses `pk_test_`

### 5.2.2.2 — Register Live Webhook in Stripe Dashboard
- **What**: Add production webhook endpoint
- **URL**: `https://sesta.cy/api/payments/webhook`
- **Events to listen for**:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `customer.subscription.created` (if subscriptions planned)
- **Done When**: Live webhook shows "Enabled" in Stripe Dashboard, endpoint health = OK

---

## 5.2.3 — Pre-Launch Payment Smoke Tests

### 5.2.3.1 — Real Payment Test
- **What**: Place one real order using your own card, charge €0.50 (adjust product price temporarily)
- **Done When**: 
  - €0.50 appears in bank statement as "SESTA KIBRIS"
  - Order marked paid in DB
  - Telegram notification received
  - Stripe Dashboard shows live payment

### 5.2.3.2 — Refund Test
- **What**: Refund the €0.50 test payment via Stripe Dashboard
- **Done When**: Refund processed in Dashboard, money returns to card within 5 days

### 5.2.3.3 — Payout Verification
- **What**: Confirm your bank account receives a Stripe payout
- **Note**: First payout may take 7 days with new accounts
- **Done When**: IBAN receives payout deposit from Stripe

---

## 5.2.4 — Production Safety Rules

```
RULE 1: sk_live_ key NEVER goes in frontend code or git history.
RULE 2: Always verify webhook signatures (constructEvent) — never skip.
RULE 3: Use idempotency keys for PaymentIntent creation to prevent duplicate charges.
RULE 4: Log all webhook events (even unhandled ones) to a DB table for debugging.
RULE 5: Set up Stripe Radar rules for basic fraud protection (Dashboard → Radar).
RULE 6: Enable email receipts in Stripe Dashboard → Emails.
```

---

## 5.3 — Delivery: Stripe Checklist

```
# Phase 5.1 — Test
[ ] 5.1.1.1 — Stripe account accessible
[ ] 5.1.1.2 — Test env vars configured
[ ] 5.1.1.3 — Stripe npm packages installed
[ ] 5.1.2.1 — Create PaymentIntent API route
[ ] 5.1.3.1 — StripeProvider component
[ ] 5.1.3.2 — CheckoutForm with PaymentElement
[ ] 5.1.3.3 — All 4 test card scenarios work
[ ] 5.1.4.1 — Webhook endpoint processes events
[ ] 5.1.4.2 — Local webhook tested with Stripe CLI
[ ] 5.1.5   — All 9 test scenarios pass ✅

# Phase 5.2 — Production
[ ] 5.2.1.1 — Stripe account verified and active
[ ] 5.2.1.2 — Statement descriptor and support info set
[ ] 5.2.2.1 — Live keys in production env only
[ ] 5.2.2.2 — Live webhook registered in Dashboard
[ ] 5.2.3.1 — Real €0.50 payment processed
[ ] 5.2.3.2 — Refund tested successfully
[ ] 5.2.3.3 — Payout to IBAN confirmed
[ ] 5.2.4   — All 6 safety rules enforced
```

