# COURIER SYSTEM

## Courier Delivery Flow Specification

---

## 1. OVERVIEW

The Courier System is intentionally minimal. A courier has one job: pick up orders and deliver them. The interface must be usable by someone who is driving, holding a phone with one hand, and has limited technical comfort.

---

## 2. PHASE 1 MODEL

- All couriers belong to a specific merchant
- Merchant creates courier accounts
- Merchant assigns orders to couriers manually
- No auto-dispatch, no shared courier pool
- Couriers cannot self-assign

---

## 3. CAPABILITIES

### 3.1 Delivery Queue

- View orders assigned to me (status: ASSIGNED or IN_TRANSIT)
- See order priority (oldest first)
- Each item shows: merchant name, customer address (short), item count, time assigned

### 3.2 Order Detail

- Full delivery address with copy-to-clipboard
- "Navigate" button → opens device maps app with address
- Order items list (what to pick up)
- Customer name and phone (tap to call)
- Customer notes (delivery instructions)
- Merchant notes (if any)

### 3.3 Delivery Actions

Two large, unmissable buttons:

**Pickup Confirmation**
- "Teslim Aldım" (I've Picked Up) → transitions to IN_TRANSIT
- Available only when status is ASSIGNED

**Delivery Completion**
- "Teslim Ettim" (Delivered) → transitions to DELIVERED
- Available only when status is IN_TRANSIT

**Delivery Failure**
- "Teslim Edilemedi" (Could Not Deliver) → requires reason → transitions to FAILED_DELIVERY
- Available only when status is IN_TRANSIT

### 3.4 Failure Reasons

| Reason Code | Turkish Display |
|---|---|
| `CUSTOMER_NOT_HOME` | "Müşteri evde değil" |
| `WRONG_ADDRESS` | "Adres bulunamadı" |
| `CUSTOMER_REFUSED` | "Müşteri teslim almak istemedi" |
| `ACCESS_PROBLEM` | "Adrese ulaşılamadı" |
| `OTHER` | Custom text input |

### 3.5 Delivery History

- Last 7 days of completed deliveries
- Shows: date, merchant, customer, status (delivered/failed)
- Simple list, no analytics

---

## 4. UX PRINCIPLES

### Simplicity Above All

- Maximum 2 taps to complete any action
- Large touch targets (minimum 56x56px for primary actions)
- High contrast buttons
- No settings, no configuration, no complexity
- Status is always visible at a glance

### One-Handed Operation

- Primary actions at bottom of screen (thumb zone)
- No horizontal scrolling
- No modals that require precision taps
- Confirmation dialogs are large and clear

### Offline Resilience

- Cache active delivery details on device
- If connection drops, courier can still view address and items
- Actions queue and sync when connection returns
- Clear "Çevrimdışı" (Offline) indicator

---

## 5. SCREEN FLOW

```
[Delivery Queue] ← Home screen
    │
    ▼ (tap delivery)
[Order Detail]
    │
    ├── [Navigate] → Opens maps app
    ├── [Call Customer] → Opens phone dialer
    │
    ├── [Teslim Aldım] → Status: IN_TRANSIT
    │       │
    │       ▼
    │   [Teslim Ettim] → Status: DELIVERED → Back to queue
    │       │
    │       ▼ (or)
    │   [Teslim Edilemedi] → Select reason → Status: FAILED_DELIVERY → Back to queue
    │
    └── (Already IN_TRANSIT? Show delivery actions directly)
```

---

## 6. NOTIFICATIONS

| Event | Notification | Action |
|---|---|---|
| New order assigned | Push + in-app + vibration | Open order detail |
| Order unassigned (merchant took it back) | In-app | Remove from queue |
| Re-dispatch after failed delivery | Push + in-app | Order reappears in queue |

---

## 7. WHAT COURIERS CANNOT DO

- Create or modify orders
- Self-assign to orders (merchant assigns)
- See other merchants' data
- See orders not assigned to them
- Access customer payment information
- Change their own account settings (merchant manages)
- See other couriers' deliveries

---

## 8. COURIER ONBOARDING

1. Merchant enters courier details in dashboard (name, phone, email)
2. System creates auth account with `role: courier`
3. Courier receives credentials (from merchant, in person or via message)
4. Courier opens PWA URL on their phone
5. Courier logs in → lands on empty delivery queue
6. First delivery assigned → courier sees it and starts working

No training material in Phase 1. The app must be self-explanatory.

---

## 9. PHASE 2+ EVOLUTION

| Phase | Addition |
|---|---|
| Phase 2 | Delivery performance tracking (success rate, avg time) |
| Phase 2 | Merchant can see courier performance metrics |
| Phase 3 | Courier self-registration on platform |
| Phase 3 | Cross-merchant delivery offers |
| Phase 3 | Zone-based availability |
| Phase 3 | Digital payouts via Stripe Connect |

---

## 10. DATA OWNERSHIP

| Data | Owned By | Courier Can |
|---|---|---|
| Courier profile | Merchant | Read own profile only |
| Assigned orders | Order System | Read, transition (pickup/deliver/fail) |
| Delivery history | Order System | Read own completed deliveries |
| Other couriers | Merchant | Cannot see |
