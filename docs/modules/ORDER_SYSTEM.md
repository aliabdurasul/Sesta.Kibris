# ORDER SYSTEM

## Order Domain Specification

---

## 1. OVERVIEW

The Order System is the central domain of SestaKibris. Every actor interacts with it. It owns the order lifecycle, total calculation, snapshot logic, state machine enforcement, and audit trail.

---

## 2. ORDER CREATION

### Trigger

Customer submits order from cart.

### Process (Edge Function: `create-order`)

1. **Validate merchant**: exists, `is_active = true`, `is_open = true`
2. **Validate items**: all products belong to merchant, all `is_available = true`, quantities > 0
3. **Fetch prices**: current prices from `products` table (NOT from client)
4. **Calculate totals**:
   - `line_total` = `unit_price × quantity` per item
   - `total_amount` = SUM of all `line_total` values
5. **Validate total**: must be > 0
6. **Snapshot address**: copy customer address fields into `delivery_address` JSONB
7. **Snapshot products**: copy `product_name` and `unit_price` into each `order_item`
8. **Insert order**: status = PENDING, timestamps set to `now()`
9. **Insert order_items**: one row per cart item
10. **Insert status log**: initial entry (from_status = NULL, to_status = PENDING, actor = customer)
11. **Return**: created order with ID

### Validation Errors

| Check | Error If |
|---|---|
| Merchant not found | 404 |
| Merchant not active | 400 MERCHANT_CLOSED |
| Merchant not open | 400 MERCHANT_CLOSED |
| Product not found | 400 PRODUCT_UNAVAILABLE |
| Product not available | 400 PRODUCT_UNAVAILABLE |
| Product wrong merchant | 400 VALIDATION_FAILED |
| Quantity <= 0 | 422 VALIDATION_FAILED |
| Empty items array | 422 VALIDATION_FAILED |
| Address not found | 404 |
| Address not owned by customer | 403 |

---

## 3. SNAPSHOT STRATEGY

### Why Snapshots

Orders must remain accurate historical records regardless of future changes to products or addresses.

### What Is Snapshotted

| Field | Snapshotted Into | Why |
|---|---|---|
| Product name | `order_items.product_name` | Merchant may rename product |
| Product price | `order_items.unit_price` | Merchant may change price |
| Delivery address | `orders.delivery_address` (JSONB) | Customer may edit/delete address |

### What Is NOT Snapshotted

| Field | Why Not |
|---|---|
| Customer name/phone | Referenced via FK, rarely changes |
| Merchant name | Referenced via FK, admin-controlled |
| Courier name | Referenced via FK, informational |

---

## 4. ORDER TOTAL CALCULATION

```
order_items[].line_total = order_items[].unit_price × order_items[].quantity
orders.total_amount = SUM(order_items[].line_total)
```

### Rules

- All arithmetic is integer (kuruş / minor currency unit)
- Frontend may show a preview total for UX but must label it "Tahmini toplam"
- Server-calculated total is the ONLY official total
- If server total differs from client preview, the server total wins
- Total is set once at creation and never recalculated (immutable)

---

## 5. STATE MACHINE

See `ORDER_STATE_MACHINE.md` for complete specification.

Summary:
- 9 states, 3 terminal (DELIVERED, REJECTED, CANCELLED)
- Every transition validated by Edge Function
- Every transition logged to `order_status_log`
- Actor role verified for each transition type

---

## 6. AUDIT TRAIL

The `order_status_log` table provides a complete, append-only history of every state change.

### Log Entry Structure

```json
{
  "id": "uuid",
  "order_id": "uuid",
  "from_status": "PENDING",
  "to_status": "CONFIRMED",
  "actor_id": "merchant-user-uuid",
  "actor_role": "merchant",
  "note": null,
  "created_at": "2026-05-14T19:05:00Z"
}
```

### Rules

- Log entry is inserted BEFORE the status field is updated
- Log entries are never updated or deleted
- Log provides complete forensic trail for disputes
- Visible to: merchant (own orders), customer (own orders), admin (all)

---

## 7. ORDER LIFECYCLE TIMESTAMPS

| Timestamp | Set When | Actor |
|---|---|---|
| `created_at` | Order placed | System |
| `accepted_at` | Transition to CONFIRMED | System (on merchant action) |
| `ready_at` | Transition to READY | System (on merchant action) |
| `assigned_at` | Transition to ASSIGNED | System (on merchant action) |
| `picked_up_at` | Transition to IN_TRANSIT | System (on courier action) |
| `delivered_at` | Transition to DELIVERED | System (on courier action) |

All timestamps are `now()` at time of transition. Never client-supplied.

---

## 8. DUPLICATE ORDER DETECTION

- If same customer places an order to same merchant within 5 minutes with identical items:
  - Frontend shows warning: "Az önce benzer bir sipariş verdiniz. Devam etmek istiyor musunuz?"
  - Not auto-blocked — customer confirms to proceed
  - Backend does NOT reject duplicates (customer might genuinely want two orders)

---

## 9. ORDER CANCELLATION

### Who Can Cancel

| State | Merchant | Admin | Customer |
|---|---|---|---|
| PENDING | Yes | Yes | No (Phase 1) |
| CONFIRMED | Yes | Yes | No |
| READY | Yes | Yes | No |
| ASSIGNED | No (unassign first) | Yes | No |
| IN_TRANSIT | No | No | No |
| FAILED_DELIVERY | Yes | Yes | No |

### Cancellation Effects

- Order status → CANCELLED
- Courier notified (if assigned)
- Customer notified
- Stock not auto-restored (Phase 1 — no stock decrement on order)
- No financial implications (Phase 1 — COD)

---

## 10. ORDER QUERYING

### Customer View

```sql
SELECT * FROM orders WHERE customer_id = auth.uid()
ORDER BY created_at DESC
```

### Merchant View

```sql
SELECT * FROM orders WHERE merchant_id = auth.merchant_id()
ORDER BY created_at DESC
```

### Courier View

```sql
SELECT * FROM orders
WHERE courier_id = auth.courier_id()
  AND status IN ('ASSIGNED', 'IN_TRANSIT')
ORDER BY assigned_at ASC
```

### Admin View (via service role)

```sql
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 50
```

All queries enforce pagination. Never load unbounded result sets.
