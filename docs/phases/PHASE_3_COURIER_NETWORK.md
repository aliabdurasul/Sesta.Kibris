# PHASE 3 — COURIER NETWORK

## Platform-Level Courier Pool

---

## 1. GOAL

Create a shared courier pool that merchants can use when they don't have their own delivery personnel. Transform from "merchant tool" to "delivery infrastructure."

---

## 2. PREREQUISITES (Phase 2 Proven)

- 30+ active merchants
- Multiple merchants requesting shared couriers
- Delivery performance data available (from Phase 1-2)
- Revenue model sustaining infrastructure costs
- Geographic density sufficient for shared couriers

---

## 3. WHAT IS BUILT

### Courier Self-Registration

- Couriers can sign up directly on the platform (not just via merchant)
- Registration: name, phone, email, vehicle type, coverage zones
- Identity verification (basic — photo ID upload)
- Admin approval step
- Platform courier profile (separate from merchant-employed couriers)

### Zone-Based Availability

- Northern Cyprus divided into delivery zones (districts)
- Couriers declare which zones they cover
- Merchants see available platform couriers for their zone
- Zone management in admin panel (create, edit, merge zones)

### Delivery Offers

- When merchant's own couriers are unavailable:
  1. Merchant clicks "Platform Kurye İste" (Request Platform Courier)
  2. System finds available platform couriers in the zone
  3. Offers the delivery to matching couriers (first-come-first-serve)
  4. Courier accepts → becomes assigned
  5. If no one accepts within 5 min → merchant notified

### Courier Performance Scoring

| Metric | Weight | Description |
|---|---|---|
| Delivery success rate | High | Completed / (Completed + Failed) |
| Average delivery time | Medium | Pickup to delivery |
| Acceptance rate | Medium | Accepted offers / Total offers |
| Customer feedback | Low (Phase 4) | Rating from customers |

### Dispatch Suggestions (Semi-Automated)

- System suggests best courier based on:
  - Availability (not currently delivering)
  - Zone match
  - Performance score
  - Recent workload (fairness)
- Merchant still makes final decision
- Full auto-dispatch NOT implemented (insufficient data)

### Courier Earnings Dashboard

- Total deliveries completed
- Earnings this week/month (if digital payout in Phase 4)
- Performance metrics
- Zone activity heatmap

---

## 4. WHAT IS NOT BUILT

| Feature | Why Not Phase 3 |
|---|---|
| Full route optimization | Requires GPS data and AI/ML |
| GPS live tracking | Privacy concerns, battery drain, implementation cost |
| Automated pricing per delivery | Need more data for fair pricing |
| Digital payment for couriers | Deferred to Phase 4 (Stripe Connect) |
| Surge pricing | Premature optimization |
| Multi-stop delivery | Too complex for initial pool |
| Scheduled deliveries via courier pool | On-demand only |

---

## 5. COURIER TYPES

### Phase 3 Introduces Two Courier Types

| Type | Description | Assignment |
|---|---|---|
| Merchant Courier | Employed by merchant (Phase 1 model) | Merchant assigns directly |
| Platform Courier | Independent, registered on platform | Offer-based assignment |

### Priority Logic

```
Order ready for delivery:
  1. Merchant's own couriers available? → Assign directly (as before)
  2. No own couriers? → Offer to platform couriers in zone
  3. No platform couriers accept? → Merchant handles manually
```

### Merchant Preference Setting

- Merchant can choose: "Always use my couriers first" (default)
- Or: "Offer to platform couriers if mine are busy"
- Or: "Only use platform couriers" (no own couriers)

---

## 6. ZONE DESIGN

### Initial Zones (Northern Cyprus)

| Zone | Area |
|---|---|
| Lefkoşa Merkez | City center |
| Gönyeli | Western suburb |
| Hamitköy / Alayköy | Northern suburbs |
| Değirmenlik | Eastern |
| Girne Merkez | Kyrenia center |
| Alsancak / Lapta | West of Girne |
| Gazimağusa | Famagusta |

### Zone Rules

- One courier can cover multiple zones
- One merchant belongs to one primary zone
- Cross-zone delivery: courier must cover both zones
- Zone boundaries defined by admin (approximate, not GPS-precise)

---

## 7. TECHNICAL ADDITIONS

### New Database Tables

| Table | Purpose |
|---|---|
| `platform_couriers` | Platform courier profiles |
| `courier_zones` | Courier ↔ zone mapping |
| `zones` | Zone definitions |
| `delivery_offers` | Offer history (offered, accepted, expired) |
| `courier_performance` | Aggregated performance metrics |

### Schema: delivery_offers

| Column | Type | Description |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK → orders |
| courier_id | uuid | FK → platform_couriers |
| status | text | 'offered', 'accepted', 'rejected', 'expired' |
| offered_at | timestamptz | When offer was sent |
| responded_at | timestamptz | When courier responded |
| expires_at | timestamptz | Auto-expire time |

### New Edge Functions

| Function | Purpose |
|---|---|
| `register-platform-courier` | Courier self-registration |
| `offer-delivery` | Send delivery offer to available couriers |
| `respond-to-offer` | Courier accepts/rejects offer |
| `calculate-performance` | Aggregate courier metrics |
| `manage-zones` | Admin zone CRUD |

---

## 8. COURIER COMPENSATION MODEL

### Phase 3 (Pre-Stripe Connect)

- Platform couriers paid by merchant directly (cash per delivery)
- Suggested rate: fixed per delivery (e.g., 50 TL per delivery)
- Rate displayed to courier before accepting offer
- No platform fee on courier payments in Phase 3

### Phase 4 (With Stripe Connect)

- Digital payout per delivery via Stripe
- Platform takes small commission from delivery fee
- Courier receives payout on standard schedule
- Full earnings transparency in courier dashboard

---

## 9. SUCCESS CRITERIA

| Metric | Target |
|---|---|
| Platform couriers registered | 20+ |
| Merchants using platform couriers | 10+ |
| Offer acceptance rate | > 70% |
| Delivery success (platform couriers) | > 90% |
| Average offer-to-pickup time | < 15 minutes |

---

## 10. ESTIMATED TIMELINE

| Component | Effort |
|---|---|
| Courier registration + profiles | 1 week |
| Zone system | 1 week |
| Offer/accept flow | 2 weeks |
| Performance scoring | 1 week |
| Dispatch suggestions | 1 week |
| Admin zone management | 3 days |
| Courier earnings dashboard | 3 days |
| **Total** | **~7-8 weeks** |
