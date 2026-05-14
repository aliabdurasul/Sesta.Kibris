# NOTIFICATION SYSTEM

## How Actors Receive Alerts

---

## 1. OVERVIEW

Notifications are critical for operational responsiveness. A missed order notification means a failed order. The notification system uses multiple channels with defined priority.

---

## 2. NOTIFICATION CHANNELS

| Channel | Priority | Availability | Latency |
|---|---|---|---|
| Supabase Realtime (in-app) | Primary | When app is open | < 1 second |
| Web Push Notification | Secondary | When app is closed | 2-10 seconds |
| SMS (Phase 2) | Fallback | Always | 5-30 seconds |

### Channel Priority Logic

```
Is app open and connected?
  → Yes: Realtime in-app notification (immediate)
  → No: Web Push notification (background)
    → Push failed? → SMS fallback (Phase 2)
```

---

## 3. NOTIFICATION EVENTS

### Events for Merchants

| Event | Urgency | Channels | Message |
|---|---|---|---|
| New order placed | HIGH | Realtime + Push + Sound | "Yeni sipariş! #{order_short_id}" |
| Order timeout approaching (10 min) | HIGH | Realtime + Push | "Sipariş #{id} bekliyor — yanıt verin" |
| Delivery failed | MEDIUM | Realtime + Push | "Teslimat başarısız: #{id}" |
| Order delivered | LOW | Realtime only | "Sipariş #{id} teslim edildi" |

### Events for Customers

| Event | Urgency | Channels | Message |
|---|---|---|---|
| Order confirmed | MEDIUM | Realtime + Push | "Siparişiniz onaylandı" |
| Order rejected | HIGH | Realtime + Push | "Siparişiniz reddedildi: {reason}" |
| Courier assigned | LOW | Realtime only | "Kuryeniz atandı" |
| Order in transit | MEDIUM | Realtime + Push | "Siparişiniz yolda" |
| Order delivered | MEDIUM | Realtime + Push | "Siparişiniz teslim edildi" |
| Order cancelled | HIGH | Realtime + Push | "Siparişiniz iptal edildi" |

### Events for Couriers

| Event | Urgency | Channels | Message |
|---|---|---|---|
| New delivery assigned | HIGH | Realtime + Push + Vibration | "Yeni teslimat atandı" |
| Delivery unassigned | MEDIUM | Realtime + Push | "Teslimat geri alındı" |
| Re-dispatch after failure | HIGH | Realtime + Push | "Teslimat tekrar atandı" |

### Events for Admins

| Event | Urgency | Channels | Message |
|---|---|---|---|
| Order timeout exceeded | HIGH | Realtime + Push | "Sipariş #{id} zaman aşımı" |
| High failure rate detected | MEDIUM | Realtime | "Yüksek başarısızlık oranı: {merchant}" |
| New merchant activated | LOW | Realtime only | "Yeni mağaza aktif: {name}" |

---

## 4. IN-APP NOTIFICATIONS

### Implementation

- Triggered by Supabase Realtime subscription events
- Displayed as toast notifications (sonner library)
- Persistent badge counts on navigation tabs
- Sound + vibration for HIGH urgency events

### Toast Behavior

| Urgency | Duration | Sound | Vibration | Dismissable |
|---|---|---|---|---|
| HIGH | Until dismissed | Yes | Yes | Manual only |
| MEDIUM | 5 seconds | No | No | Auto + manual |
| LOW | 3 seconds | No | No | Auto + manual |

### Badge Counts

- Merchant: pending orders count on "Orders" tab
- Courier: assigned deliveries count on "Deliveries" tab
- Customer: no badge (tracking page shows live status)

---

## 5. WEB PUSH NOTIFICATIONS

### Implementation

- Web Push API with VAPID keys
- Service Worker registered on first visit
- Permission requested after first successful interaction (not on page load)

### Permission Request Strategy

- **Customer**: After placing first order — "Sipariş durumunuz hakkında bildirim almak ister misiniz?"
- **Merchant**: During onboarding — "Yeni siparişler için bildirim izni verin" (critical, strongly encouraged)
- **Courier**: During first login — "Yeni teslimatlar için bildirim izni verin" (critical)

### Push Payload

```json
{
  "title": "Yeni Sipariş!",
  "body": "Sipariş #A1B2 — 3 ürün, ₺150,00",
  "icon": "/icons/notification-192.png",
  "badge": "/icons/badge-72.png",
  "tag": "order-new-{order_id}",
  "data": {
    "url": "/merchant/orders/{order_id}",
    "type": "new_order"
  }
}
```

### Click Behavior

- Clicking notification opens the relevant screen (order detail, tracking page, etc.)
- If app is already open, navigate to the relevant page
- If app is closed, open app and navigate

---

## 6. SOUND DESIGN

### Merchant New Order Sound

- Short, attention-grabbing tone (like a register "ding")
- Plays once on new order
- Repeats every 30 seconds if order remains PENDING and unacknowledged (Phase 2)
- Merchant can mute temporarily (snooze) but not disable permanently

### Courier Assignment Sound

- Brief vibration pattern + notification sound
- Standard device notification sound

### Customer

- No custom sounds (standard push notification sound)

---

## 7. NOTIFICATION PREFERENCES (Phase 2)

| Setting | Options | Default |
|---|---|---|
| Push notifications | On / Off | On |
| Sound for new orders | On / Off | On |
| SMS fallback | On / Off | Off (requires phone verification) |
| Quiet hours | Time range | None |

Phase 1: No preferences. All notifications on by default.

---

## 8. SMS FALLBACK (Phase 2)

### When SMS Is Sent

- Order has been PENDING for > 5 minutes AND push notification was not acknowledged
- Only for merchants and couriers (not customers in Phase 2)
- Rate limited: max 20 SMS per merchant per day

### SMS Provider

- To be selected based on KKTC carrier support
- Must support Turkish characters
- Must have delivery confirmation

---

## 9. ARCHITECTURE

### Notification Trigger Flow

```
Order state changes (Edge Function)
    │
    ├── Updates database (Realtime broadcasts automatically)
    │
    └── Calls notification Edge Function
            │
            ├── Determines recipients and urgency
            ├── Sends Web Push (if subscribed)
            └── Queues SMS (Phase 2, if conditions met)
```

### Storage

- Push subscriptions stored in `push_subscriptions` table
- Fields: user_id, endpoint, keys (p256dh, auth), created_at
- Cleaned up on unsubscribe or failed delivery (410 Gone response)
