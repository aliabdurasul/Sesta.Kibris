# PAYMENT SYSTEM

## Payment Architecture (Future — Phase 4)

---

## 1. OVERVIEW

This document defines the payment architecture for when digital payments are introduced. No payment code exists until Phase 4. This specification exists to ensure Phase 1-3 architecture does not block payment integration.

**Phase 1-3 payment model**: Cash on Delivery (COD). The `total_amount` field is a reference for what the courier collects, not a digital transaction.

---

## 2. STRIPE CONNECT MODEL

### Platform Type

SestaKibris operates as a **Stripe Connect Platform** with merchants as Connected Accounts.

### Connected Account Type

**Express Accounts** — merchants do not need to manage Stripe directly. SestaKibris handles the entire payment UX.

### Why Express (Not Standard or Custom)

| Factor | Express | Standard | Custom |
|---|---|---|---|
| Onboarding friction | Low (Stripe-hosted) | High (self-built) | Very high |
| Merchant Stripe knowledge | None needed | Required | Required |
| Platform control | Medium | Low | High |
| Compliance burden | Stripe handles | Merchant handles | Platform handles |
| Implementation effort | Low | Medium | High |

Express is correct for Phase 4 because merchants are small, non-technical, and should not manage Stripe.

---

## 3. PAYMENT FLOW

### Customer Checkout

```
Customer selects "Online Ödeme" at checkout
    │
    ▼
Stripe Payment Element rendered (card input)
    │
    ▼
PaymentIntent created (server-side Edge Function)
    │
    ├── amount = order total_amount
    ├── application_fee_amount = commission (calculated)
    ├── transfer_data.destination = merchant's connected_account_id
    │
    ▼
Customer confirms payment
    │
    ▼
Payment succeeds → Order created with status PENDING + payment_status: PAID
    │
    ▼
Normal order lifecycle proceeds (CONFIRMED → READY → ASSIGNED → IN_TRANSIT)
    │
    ▼
Order status → DELIVERED
    │
    ▼
Transfer to merchant executed automatically
    │
    ▼
Merchant receives payout on Stripe's standard schedule
```

### Mixed Payment Support

In Phase 4, both COD and online payment coexist:

| Payment Method | Field | Flow |
|---|---|---|
| COD | `payment_method: 'cod'` | Courier collects cash, no Stripe involved |
| Card | `payment_method: 'card'` | Stripe processes, auto-transfer on delivery |

---

## 4. COMMISSION STRUCTURE

### Calculation

```
application_fee = order.total_amount × commission_rate
merchant_receives = order.total_amount - application_fee
```

### Commission Rate

- Configurable per merchant tier
- Default: 2% (to be validated with market)
- Stored in `merchants.commission_rate` (decimal, e.g., 0.02)
- Transparent to merchant (shown in dashboard)

### Commission Rules

- Commission is deducted from payout, NOT added to customer price
- Customer pays the displayed price; platform takes cut from merchant share
- Commission rate can vary by merchant tier (Growth vs Pro)
- Commission only applies to digital payments (not COD)

---

## 5. PAYOUT LOGIC

### Trigger

Payout (transfer) is triggered by the `DELIVERED` status transition.

### Flow

```
Order → DELIVERED
    │
    ▼
Edge Function: process-delivery-payout
    │
    ├── Verify payment_status = PAID
    ├── Verify payment_method = 'card'
    ├── Calculate: merchant_amount = total - commission
    ├── Execute Stripe Transfer to connected account
    └── Log payout in payout_log table
```

### Payout Schedule

- Transfer is created immediately on delivery confirmation
- Actual bank payout follows Stripe's standard schedule (2-7 business days)
- Merchant sees "pending payout" in dashboard immediately

---

## 6. REFUND FLOW

### When Refund Happens

| Scenario | Refund? | Amount |
|---|---|---|
| Order CANCELLED before pickup | Full refund | 100% |
| Order CANCELLED after pickup (rare) | Full refund | 100% |
| FAILED_DELIVERY → CANCELLED | Full refund | 100% |
| Partial order fulfillment | Partial refund | Pro-rated (Phase 4+) |
| Dispute / complaint | Case by case | Admin decision |

### Refund Process

```
Order → CANCELLED (where payment_method = 'card' AND payment_status = 'PAID')
    │
    ▼
Edge Function: process-refund
    │
    ├── Reverse the Stripe charge (full refund)
    ├── Reverse the Transfer (if already executed)
    ├── Update payment_status = 'REFUNDED'
    └── Log refund in payout_log
```

---

## 7. MERCHANT ONBOARDING (STRIPE)

### Flow

```
Admin onboards merchant (existing flow)
    │
    ▼
Merchant logs in → sees "Activate Online Payments" prompt
    │
    ▼
Merchant clicks → redirected to Stripe Express onboarding
    │
    ├── Stripe collects: business info, bank details, identity verification
    │
    ▼
Stripe returns → connected_account_id stored in merchants table
    │
    ▼
Merchant can now receive digital payments
```

### Fields Added to `merchants` Table (Phase 4)

| Column | Type | Description |
|---|---|---|
| `stripe_account_id` | text | Stripe Connected Account ID |
| `stripe_onboarding_complete` | boolean | Whether Stripe setup is done |
| `commission_rate` | decimal | Platform commission (e.g., 0.02) |
| `accepts_online_payment` | boolean | Whether online payment is enabled |

---

## 8. DATABASE ADDITIONS (Phase 4)

### orders table additions

| Column | Type | Description |
|---|---|---|
| `payment_method` | text | 'cod' or 'card' |
| `payment_status` | text | 'pending', 'paid', 'refunded', NULL (for COD) |
| `stripe_payment_intent_id` | text | Stripe PI reference |

### New table: `payout_log`

| Column | Type | Description |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK → orders |
| merchant_id | uuid | FK → merchants |
| type | text | 'transfer', 'refund' |
| amount | integer | Amount in kuruş |
| commission | integer | Platform fee amount |
| stripe_transfer_id | text | Stripe Transfer ID |
| status | text | 'pending', 'completed', 'failed' |
| created_at | timestamptz | |

---

## 9. WHAT PHASE 1-3 MUST NOT DO

To avoid blocking Phase 4:

- Do NOT hardcode `payment_method = 'cod'` without making it a field
- Do NOT make any logic assume payment is always COD
- Do NOT skip the `total_amount` field (it becomes the charge amount)
- Do NOT build order completion logic that only works for COD
- DO design the order lifecycle to be payment-method agnostic
- DO keep `total_amount` as server-calculated integer

---

## 10. WEBHOOK HANDLING (Phase 4)

Stripe sends webhooks for:
- `payment_intent.succeeded` → confirm payment received
- `payment_intent.payment_failed` → handle failure
- `account.updated` → merchant Stripe account status change
- `transfer.created` → payout initiated
- `charge.dispute.created` → dispute opened

All webhooks verified via Stripe signature before processing.
