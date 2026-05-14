# REALTIME STRATEGY

## What Uses Realtime and What Does Not

---

## 1. PRINCIPLE

Realtime is a **feature**, not a default. Every Supabase Realtime subscription adds connection overhead and complexity. Use it only where one actor's action must be immediately visible to another actor.

---

## 2. SUBSCRIPTION MAP

### Screens That USE Realtime

| Screen | Actor | Subscribes To | Filter |
|---|---|---|---|
| Order Queue | Merchant | `orders` table (INSERT, UPDATE) | `merchant_id = own_merchant_id` |
| Order Detail | Merchant | `orders` row (UPDATE) | `id = specific_order_id` |
| Order Tracking | Customer | `orders` row (UPDATE) | `id = specific_order_id` |
| Delivery Queue | Courier | `orders` table (UPDATE) | `courier_id = own_courier_id` AND status IN (ASSIGNED, IN_TRANSIT) |
| Admin Dashboard | Admin | `orders` table (INSERT, UPDATE) | No filter (platform-wide) |

### Screens That DO NOT Use Realtime

| Screen | Actor | Reason | Strategy Instead |
|---|---|---|---|
| Product Catalog | Customer | Changes infrequently | Server-rendered, ISR/revalidation |
| Order History | Customer | Historical data, not live | Standard query on page load |
| Customer Profile | Customer | Self-managed, no external updates | Standard query |
| Catalog Editor | Merchant | Own edits, no external input | Optimistic UI + standard mutations |
| Courier History | Courier | Historical data | Standard query on page load |
| Merchant Analytics | Merchant | Aggregated data, not real-time critical | Query on page load, refresh button |
| Admin Merchant List | Admin | Changes infrequently | Standard query, manual refresh |

---

## 3. SUBSCRIPTION LIFECYCLE RULES

### 3.1 Subscribe

- Subscribe when the component/page mounts
- Always include the narrowest possible filter
- Never subscribe to entire tables without a filter (except admin dashboard)

### 3.2 Unsubscribe

- Unsubscribe when the component/page unmounts
- Unsubscribe when navigating away from the screen
- Unsubscribe when the user's session expires

### 3.3 Reconnection

- If the Realtime connection drops, the client must:
  1. Show a visible "Bağlantı kesildi" (Disconnected) indicator
  2. Attempt automatic reconnection (Supabase client handles this)
  3. On reconnect, re-fetch the latest state (stale data may have been missed)
  4. Remove the disconnected indicator only after successful re-sync

---

## 4. CONNECTION STATUS VISIBILITY

### Merchant Dashboard

A persistent connection status indicator must be visible:
- **Green dot**: Connected, receiving live updates
- **Yellow dot**: Reconnecting...
- **Red dot**: Disconnected — "Yeni siparişleri göremeyebilirsiniz" (You may not see new orders)

### Courier App

Same indicator with courier-specific messaging:
- **Red**: "Bağlantı kesildi — yeni görevleri göremeyebilirsiniz"

### Customer Order Tracking

Less critical but still visible:
- If disconnected during active tracking, show "Son güncelleme: X dakika önce" (Last update: X minutes ago)

---

## 5. REALTIME EVENTS BY ORDER LIFECYCLE

| Event | Who Broadcasts | Who Receives | Channel |
|---|---|---|---|
| New order created | System (on INSERT) | Merchant | Merchant's order subscription |
| Order confirmed | Merchant (on UPDATE) | Customer | Customer's order tracking subscription |
| Order rejected | Merchant (on UPDATE) | Customer | Customer's order tracking subscription |
| Order ready | Merchant (on UPDATE) | — | No subscription needed (merchant action) |
| Courier assigned | Merchant (on UPDATE) | Courier, Customer | Courier's delivery subscription, Customer's tracking |
| Order picked up | Courier (on UPDATE) | Customer, Merchant | Customer's tracking, Merchant's order subscription |
| Order delivered | Courier (on UPDATE) | Customer, Merchant | Customer's tracking, Merchant's order subscription |
| Delivery failed | Courier (on UPDATE) | Merchant | Merchant's order subscription |

---

## 6. PERFORMANCE GUIDELINES

### Connection Limits

- Supabase Free tier: 200 concurrent connections
- Supabase Pro tier: 500 concurrent connections (upgradeable)
- Monitor connection count as merchant count grows
- At 500+ merchants, evaluate dedicated Realtime configuration

### Subscription Best Practices

- Use `postgres_changes` channel type (not broadcast or presence)
- Filter at the subscription level, not in JavaScript after receiving
- One subscription per screen (combine multiple interests where possible)
- Never open multiple subscriptions to the same table with different filters on one page

### Payload Size

- Realtime payloads include the full row by default
- For `orders` table, this is acceptable (reasonable column count)
- If payload becomes large in future, use `.select()` to limit columns in subscription

---

## 7. FALLBACK STRATEGY

If Realtime is unavailable or degraded:

| Priority | Fallback |
|---|---|
| Merchant new orders | Push notification (Web Push API) as secondary channel |
| Customer tracking | Manual refresh button + "Yenile" prompt after 30s of no updates |
| Courier assignments | Push notification |

Realtime is the primary channel. Push notifications are the safety net, not a replacement.

---

## 8. WHAT REALTIME IS NOT FOR

- **Analytics aggregation**: Use scheduled queries or on-demand calculation
- **Chat or messaging**: Not in scope
- **Live GPS coordinates**: Not in Phase 1-2
- **Presence (who's online)**: Not needed in current design
- **Catalog price changes**: Server-render handles this on next page load
