# PHASE 2 — MULTI-MERCHANT SCALE

## Growth and Monetization

---

## 1. GOAL

Support 10-100 merchants with a sustainable SaaS revenue model. Transition from "free tool" to "business you pay for because it makes you money."

---

## 2. PREREQUISITES (Phase 1 Proven)

- 3+ merchants actively using the system daily
- > 85% delivery success rate
- Merchants prefer SestaKibris over WhatsApp for orders
- System is stable under daily operational load
- Customer acquisition is happening organically (word of mouth)

---

## 3. WHAT IS BUILT

### SaaS Subscription

- Merchant subscription tiers (Starter/Growth/Pro)
- Billing integration (Stripe Billing — subscription management)
- Usage tracking (order count per month)
- Tier enforcement (order limits, courier limits)
- Payment method management for merchants
- Invoice generation

### Tier Structure

| Tier | Price | Order Limit | Couriers | Features |
|---|---|---|---|---|
| Starter | Free | 50/month | 1 | Basic order flow |
| Growth | TBD | 500/month | 5 | Analytics, inventory |
| Pro | TBD | Unlimited | Unlimited | All features, priority support |

### Self-Service Merchant Onboarding

- Merchant registration form (public)
- Email verification
- Store setup wizard (name, category, address)
- Product entry interface (guided)
- Courier addition flow
- Go-live checklist
- Admin approval step (quality gate)

### Merchant Analytics

- Orders: today, this week, this month (with trends)
- Revenue: same time periods
- Average fulfillment time (order → delivered)
- Rejection rate with trend
- Top products by order frequency
- Peak order hours
- Customer count (unique customers who ordered)
- Repeat customer rate

### Inventory Management

- Auto-decrement stock on order confirmation
- Auto-increment on cancellation/rejection
- Low stock alerts (configurable threshold)
- Out-of-stock auto-hide from catalog
- Stock history log
- Bulk stock update

### Customer CRM (Merchant View)

- Customer list (who has ordered from this merchant)
- Order count per customer
- Last order date
- Total spend per customer
- Customer notes (merchant-added)

### SMS Fallback Notifications

- SMS sent when push notification unacknowledged (5 min)
- Merchant and courier only
- Rate limited (20/day/merchant)
- Opt-in configuration

### Improved Admin Tools

- Merchant performance dashboard (cross-merchant metrics)
- Self-service onboarding review queue
- Feature flag management
- System health dashboard (detailed)
- Merchant communication tools

---

## 4. WHAT IS NOT BUILT

| Feature | Why Not Phase 2 |
|---|---|
| Platform courier pool | Need more data, more merchants first |
| Digital payments for customers | Trust still building, COD working |
| Route optimization | No GPS data yet |
| B2B features | Market not ready |
| White-label | Premature |
| Live GPS tracking | Not needed yet |
| Multi-language | Still focused on KKTC Turkish market |
| Customer referral system | Organic growth sufficient |

---

## 5. PRICING PHILOSOPHY

- Price must be below the cost of ONE missed order due to WhatsApp chaos
- Merchants must feel they are saving money, not spending money
- Free tier retained as product-led growth funnel
- Annual subscription with discount available

### Value Communication

"Ayda 50+ sipariş alıyorsanız, Growth planına geçin. Tek bir kaçırılan sipariş maliyetinden daha az."

(If you get 50+ orders per month, upgrade to Growth. Less than the cost of a single missed order.)

---

## 6. TECHNICAL ADDITIONS

### New Database Tables

| Table | Purpose |
|---|---|
| `subscriptions` | Merchant subscription records |
| `usage_logs` | Monthly order count per merchant |
| `inventory_log` | Stock change history |
| `sms_log` | SMS send records |

### New Edge Functions

| Function | Purpose |
|---|---|
| `create-subscription` | Handle merchant subscription signup |
| `check-usage-limits` | Enforce tier limits |
| `send-sms-notification` | SMS fallback dispatch |
| `generate-analytics` | Compute merchant analytics |
| `bulk-stock-update` | Batch inventory changes |

### Infrastructure Changes

- Supabase Pro plan (more connections, storage)
- SMS provider integration
- Analytics data pipeline (scheduled aggregation)
- Monitoring upgrade (alerting, dashboards)

---

## 7. ESTIMATED TIMELINE

| Component | Effort |
|---|---|
| Subscription system + billing | 2 weeks |
| Self-service onboarding | 1 week |
| Merchant analytics | 1 week |
| Inventory management | 1 week |
| Customer CRM | 3 days |
| SMS integration | 3 days |
| Admin improvements | 1 week |
| **Total** | **~6-8 weeks** |

---

## 8. SUCCESS CRITERIA

| Metric | Target |
|---|---|
| Active merchants | 30+ |
| Paying merchants (Growth/Pro) | 10+ |
| Monthly recurring revenue | Positive (covers infrastructure costs) |
| Self-service signups | > 50% of new merchants |
| Merchant churn rate | < 10% monthly |
| System uptime | > 99.5% |
