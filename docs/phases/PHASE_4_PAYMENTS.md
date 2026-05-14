# PHASE 4 — PAYMENTS + STRIPE CONNECT

## Digital Payment Integration

---

## 1. GOAL

Enable customers to pay online with automated merchant payouts and platform commission. Transform from COD-only to a mixed payment model.

---

## 2. PREREQUISITES (Phase 3 Proven)

- 50+ active merchants
- Customer trust established (high delivery success rate)
- Legal entity formed for payment processing
- Stripe Connect available for KKTC businesses (verified)
- Merchant demand for digital payments documented
- Platform courier network operational

---

## 3. WHAT IS BUILT

### Customer Payment

- Payment method selection at checkout: "Nakit" (COD) or "Kart ile Öde" (Pay by Card)
- Stripe Payment Element embedded in checkout
- Card saved for future orders (optional)
- Payment confirmation before order creation
- Refund processing for cancelled orders

### Merchant Stripe Onboarding

- "Online Ödeme Aktifleştir" button in merchant settings
- Redirect to Stripe Express onboarding (hosted by Stripe)
- Stripe collects: business info, bank account, identity
- On completion: merchant can receive digital payments
- Onboarding status visible in merchant dashboard

### Automated Payouts

- On `DELIVERED` status: transfer triggered to merchant's connected account
- Commission automatically deducted
- Payout follows Stripe's standard schedule (2-7 business days)
- Merchant sees pending/completed payouts in dashboard

### Commission System

- Per-merchant commission rate (configurable by admin)
- Default: 2% of order total
- Commission deducted from merchant payout (not added to customer price)
- Commission visible in merchant dashboard and admin reports
- Commission rate can vary by tier

### Refund Flow

- Automatic refund on order cancellation (if paid by card)
- Full refund for orders cancelled before delivery
- Partial refund capability for partial fulfillment
- Refund status visible to customer

### Platform Courier Payouts

- Platform couriers receive digital payout per delivery
- Delivery fee transferred to courier's connected account
- Platform takes small commission (configurable)
- Courier earnings visible in dashboard

### Financial Reporting

- Merchant: daily/weekly/monthly payout summary
- Admin: platform revenue (total commissions), payout volume, refund volume
- Exportable reports (CSV)

---

## 4. WHAT IS NOT BUILT

| Feature | Why Not Phase 4 |
|---|---|
| Marketplace multi-cart checkout | Single merchant per order remains |
| Credit/wallet system | Adds complexity, regulatory burden |
| Installment payments | Not supported by local market |
| B2B invoicing | Phase 5 feature |
| Cryptocurrency | Not relevant to market |
| PayPal/alternative processors | Stripe covers all needs |
| Subscription payments for customers | Not applicable |

---

## 5. STRIPE INTEGRATION ARCHITECTURE

### Account Structure

```
SestaKibris Platform Account (Stripe)
    │
    ├── Connected Account: Merchant A (Express)
    ├── Connected Account: Merchant B (Express)
    ├── Connected Account: Merchant C (Express)
    ├── Connected Account: Courier 1 (Express)
    └── Connected Account: Courier 2 (Express)
```

### Payment Flow

```
Customer → Payment Element → PaymentIntent created
    │
    ├── amount: order total
    ├── application_fee_amount: commission
    ├── transfer_data.destination: merchant connected account
    │
    ▼
Payment confirmed → Order created (status: PENDING, payment_status: PAID)
    │
    ▼ (normal order lifecycle)
    │
    ▼
Order DELIVERED → Transfer executed → Merchant receives funds
```

### Webhook Events

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Confirm payment, proceed with order |
| `payment_intent.payment_failed` | Show error, order not created |
| `charge.refunded` | Update payment_status |
| `account.updated` | Update merchant Stripe status |
| `transfer.created` | Log payout initiation |
| `payout.paid` | Log actual bank deposit |
| `charge.dispute.created` | Alert admin, pause merchant payout |

---

## 6. DATABASE CHANGES

### Modified Tables

**orders** — new columns:
- `payment_method` (text): 'cod' | 'card'
- `payment_status` (text): 'pending' | 'paid' | 'refunded' | NULL
- `stripe_payment_intent_id` (text)

**merchants** — new columns:
- `stripe_account_id` (text)
- `stripe_onboarding_complete` (boolean)
- `commission_rate` (decimal)
- `accepts_online_payment` (boolean)

### New Tables

**payout_log**:
- Tracks all transfers and refunds
- Links to orders and merchants
- Stripe Transfer/Refund IDs for reconciliation

**payment_methods** (optional):
- Saved cards for returning customers
- Encrypted Stripe payment method IDs

---

## 7. SECURITY CONSIDERATIONS

| Risk | Mitigation |
|---|---|
| Stripe secret key exposure | Server-only, Edge Functions only |
| Webhook spoofing | Signature verification on all webhooks |
| Payment amount manipulation | Amount set server-side from order total |
| Fake delivery to trigger payout | Admin monitoring, customer confirmation (future) |
| Refund fraud | Rate limiting, admin alerts on high refund volume |
| Connected account fraud | Stripe's built-in fraud detection |

---

## 8. MIXED PAYMENT UX

### Customer Checkout

```
┌────────────────────────────────────┐
│  Ödeme Yöntemi                     │
│                                    │
│  ○ Kapıda Nakit (COD)             │
│  ● Kart ile Öde                    │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Card Number: ______________ │  │
│  │  Expiry: __/__  CVC: ___    │  │
│  └──────────────────────────────┘  │
│                                    │
│  [Siparişi Onayla — ₺150,00]     │
└────────────────────────────────────┘
```

### Merchant Dashboard

```
┌────────────────────────────────────┐
│  Bugünkü Kazanç                    │
│                                    │
│  Kart ödemeleri: ₺2.450,00       │
│  Nakit siparişler: ₺1.800,00     │
│  Komisyon: -₺49,00                │
│  Net kazanç: ₺4.201,00           │
│                                    │
│  Bekleyen ödeme: ₺2.401,00       │
│  (2-3 iş günü içinde hesabınıza) │
└────────────────────────────────────┘
```

---

## 9. SUCCESS CRITERIA

| Metric | Target |
|---|---|
| Merchants with Stripe connected | 30+ |
| Orders paid by card | > 20% of total orders |
| Payout success rate | > 99% |
| Refund processing time | < 24 hours |
| Platform commission revenue | Covers infrastructure + growth |
| Customer payment disputes | < 0.5% |

---

## 10. ESTIMATED TIMELINE

| Component | Effort |
|---|---|
| Stripe Connect setup + merchant onboarding | 2 weeks |
| Payment Element integration | 1 week |
| Payout automation | 1 week |
| Refund flow | 1 week |
| Webhook handling | 1 week |
| Financial reporting | 1 week |
| Platform courier payouts | 1 week |
| Testing + security audit | 2 weeks |
| **Total** | **~10-12 weeks** |
