# MERCHANT SYSTEM

## Merchant Operations Specification

---

## 1. OVERVIEW

The Merchant System is the operational core of SestaKibris. It handles order management, catalog maintenance, courier dispatch, and store configuration. This is the most complex actor system.

---

## 2. CAPABILITIES

### 2.1 Order Management

**Incoming Orders (Real-time)**
- New orders appear instantly via Realtime subscription
- Visual + audio notification for new orders
- Orders displayed in a queue sorted by creation time (newest first)
- Each order shows: customer name, item count, total, time since placed

**Order Actions**
- **Accept** → transitions to CONFIRMED
- **Reject** → requires reason selection, transitions to REJECTED
- **Mark Ready** → transitions to READY (after physical preparation)
- **Assign Courier** → select from available couriers, transitions to ASSIGNED
- **Unassign Courier** → returns to READY state

**Order Filters**
- Active orders (PENDING, CONFIRMED, READY, ASSIGNED, IN_TRANSIT)
- Completed orders (DELIVERED)
- Problematic orders (REJECTED, FAILED_DELIVERY, CANCELLED)
- Date range filter

### 2.2 Catalog Management

**Products**
- Add new product (name, price, unit, description, image, stock count)
- Edit existing product
- Toggle availability (is_available on/off without deleting)
- Set display order (drag-and-drop reordering)
- Upload product images (Supabase Storage)

**Inventory**
- Set stock count (nullable = unlimited)
- Stock auto-decrements on order confirmation (Phase 2)
- Low stock warnings (Phase 2)

### 2.3 Courier Management

**Roster**
- View all couriers (active and inactive)
- Add new courier (name, phone, email → creates auth account)
- Activate/deactivate couriers
- See courier current load (active deliveries count)

**Assignment**
- When order is READY, merchant selects a courier
- Courier list shows: name, active delivery count, status
- Assignment sends real-time notification to courier

### 2.4 Store Configuration

- Toggle store open/closed (is_open)
- Edit store information (name, address, phone)
- Set order timeout duration
- View store analytics (Phase 2)

---

## 3. ORDER QUEUE UX

The order queue is the merchant's **home screen**. It must be fast, clear, and urgent.

### Display Structure

```
┌──────────────────────────────────────┐
│  📢 3 Yeni Sipariş                   │  ← Count badge for PENDING
├──────────────────────────────────────┤
│  [PENDING] Sipariş #1234             │
│  Ahmet Y. • 5 ürün • ₺150.00        │
│  3 dakika önce                       │
│  [Kabul Et] [Reddet]                 │
├──────────────────────────────────────┤
│  [CONFIRMED] Sipariş #1233           │
│  Mehmet K. • 2 ürün • ₺45.00        │
│  Kabul edildi • 10 dk önce           │
│  [Hazır İşaretle]                    │
├──────────────────────────────────────┤
│  [READY] Sipariş #1232              │
│  Zeynep A. • 3 ürün • ₺85.00        │
│  Hazır • 5 dk önce                   │
│  [Kurye Ata]                         │
└──────────────────────────────────────┘
```

### Urgency Indicators

| State | Visual Treatment |
|---|---|
| PENDING (new) | Bold, highlight color, time counter |
| PENDING (> 5 min) | Warning color, "Bekliyor!" badge |
| PENDING (> timeout) | Red alert, urgent notification |
| CONFIRMED | Normal, action available |
| READY | Needs courier assignment indicator |
| ASSIGNED / IN_TRANSIT | Dimmed, "in progress" section |

---

## 4. REJECTION REASONS

Merchants must select a reason when rejecting an order:

| Reason Code | Turkish Display | When Used |
|---|---|---|
| `OUT_OF_STOCK` | "Ürünler stokta yok" | Items unavailable |
| `CLOSING_SOON` | "Mağaza kapanıyor" | Too late to fulfill |
| `TOO_BUSY` | "Yoğunluk nedeniyle" | Cannot handle more orders |
| `DELIVERY_AREA` | "Teslimat bölgesi dışında" | Address too far |
| `OTHER` | Custom text input | Merchant writes reason |

---

## 5. STORE HOURS BEHAVIOR

- When `is_open = false`:
  - Customers see "Bu mağaza şu anda kapalı"
  - Order submission is blocked
  - Existing in-progress orders continue normally
- Merchant can toggle open/closed at any time
- No scheduled hours in Phase 1 (manual toggle only)
- Scheduled hours planned for Phase 2

---

## 6. NOTIFICATIONS FOR MERCHANTS

| Event | Notification |
|---|---|
| New order placed | In-app badge + sound + push notification |
| Order timeout approaching | In-app warning |
| Delivery failed | In-app alert with details |
| Courier marked delivered | Subtle confirmation |

---

## 7. WHAT MERCHANTS CANNOT DO

- See other merchants' data (enforced by RLS)
- Modify customer information
- Force payment collection (Phase 1)
- Access platform-level analytics
- Create customer accounts
- Self-register (admin must onboard)
- See courier location / GPS

---

## 8. ANALYTICS (Phase 2)

| Metric | Description |
|---|---|
| Orders today/week/month | Count with trend |
| Revenue today/week/month | Sum of order totals |
| Average fulfillment time | Order created → delivered |
| Rejection rate | Percentage of orders rejected |
| Top products | Most ordered items |
| Peak hours | When most orders arrive |

---

## 9. DATA OWNERSHIP

| Data | Owned By | Merchant Can |
|---|---|---|
| Merchant profile | Merchant (+ Admin) | Read, Update (limited) |
| Products | Merchant | CRUD |
| Couriers | Merchant | Create, Read, Update status |
| Orders (own) | Order System | Read, Transition state |
| Customer info | Customer | Read name/phone on their orders only |
