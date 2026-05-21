# ORDER STATE MACHINE

## Complete Order Lifecycle Specification

---

## 1. ALL ORDER STATES

| State | Meaning | Terminal? |
|---|---|---|
| `PENDING` | Order submitted by customer, awaiting merchant action | No |
| `CONFIRMED` | Merchant has accepted the order | No |
| `REJECTED` | Merchant has rejected the order | **Yes** |
| `READY` | Merchant has prepared the order, awaiting courier | No |
| `ASSIGNED` | Courier has been assigned to this order | No |
| `IN_TRANSIT` | Courier has picked up and is en route | No |
| `DELIVERED` | Courier confirmed delivery | **Yes** |
| `FAILED_DELIVERY` | Courier could not complete delivery | No |
| `CANCELLED` | Order cancelled by admin or merchant | **Yes** |

---

## 2. VALID TRANSITIONS

| From | To | Actor | Required Data |
|---|---|---|---|
| PENDING | CONFIRMED | Merchant | — |
| PENDING | REJECTED | Merchant | `rejection_reason` (required) |
| PENDING | CANCELLED | Admin | `note` (recommended) |
| CONFIRMED | READY | Merchant | — |
| CONFIRMED | CANCELLED | Merchant, Admin | `note` (recommended) |
| READY | ASSIGNED | Merchant | `courier_id` (required) |
| READY | CANCELLED | Merchant, Admin | `note` (recommended) |
| ASSIGNED | IN_TRANSIT | Courier | — |
| ASSIGNED | READY | Merchant | — (unassign courier) |
| IN_TRANSIT | DELIVERED | Courier | — |
| IN_TRANSIT | FAILED_DELIVERY | Courier | `failure_reason` (required) |
| FAILED_DELIVERY | IN_TRANSIT | Merchant | — (re-dispatch) |
| FAILED_DELIVERY | CANCELLED | Merchant, Admin | `note` (recommended) |

---

## 3. STATE DIAGRAM

```
                    ┌──────────┐
                    │ PENDING  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼          │          ▼
        ┌──────────┐    │    ┌──────────┐
        │CONFIRMED │    │    │ REJECTED │ (terminal)
        └────┬─────┘    │    └──────────┘
             │          │
             ▼          │
        ┌──────────┐    │
        │  READY   │◄───┤
        └────┬─────┘    │
             │          │
             ▼          │
        ┌──────────┐    │
        │ ASSIGNED │────┘ (can unassign back to READY)
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │IN_TRANSIT│
        └────┬─────┘
             │
       ┌─────┼─────┐
       ▼           ▼
 ┌──────────┐ ┌────────────────┐
 │DELIVERED │ │FAILED_DELIVERY │──→ IN_TRANSIT (re-dispatch)
 │(terminal)│ └────────────────┘──→ CANCELLED
 └──────────┘

 CANCELLED can be reached from: PENDING, CONFIRMED, READY, FAILED_DELIVERY
 (Actor: Admin or Merchant, depending on state)
```

---

## 4. INVALID TRANSITIONS (Must Be Rejected)

| Attempted | Reason |
|---|---|
| DELIVERED → anything | Terminal state, immutable |
| REJECTED → anything | Terminal state, immutable |
| CANCELLED → anything | Terminal state, immutable |
| PENDING → IN_TRANSIT | Must follow: CONFIRMED → READY → ASSIGNED → IN_TRANSIT |
| PENDING → DELIVERED | Must follow full lifecycle |
| CONFIRMED → IN_TRANSIT | Courier must be assigned first |
| READY → DELIVERED | Courier must be assigned and in transit first |
| IN_TRANSIT → ASSIGNED | Cannot go backwards through assignment |
| Customer → any transition | Customers do not transition order states |

---

## 5. TRANSITION RULES

1. **Every transition is logged** to `order_status_log` BEFORE the status field is updated on the order.
2. **Actor role is validated** for every transition. A courier cannot accept an order. A customer cannot mark delivered.
3. **Timestamps are server-set** — `accepted_at`, `delivered_at`, etc. use `now()`, never client clock.
4. **No state can be skipped.** The flow is linear except for the failure/re-dispatch loop.
5. **Terminal states are immutable.** DELIVERED, REJECTED, and CANCELLED rows cannot be updated after reaching that state.
6. **Required fields are validated.** Rejections without reason are rejected. Failed deliveries without reason are rejected.

---

## 6. TIMEOUT BEHAVIOR

### Merchant Response Timeout

- Configurable per merchant via `merchants.order_timeout_minutes` (default: 15)
- When timeout is reached and order is still PENDING:
  - Order flagged as `PENDING_TIMEOUT` (internal flag, not a state change)
  - Admin is alerted
  - Customer receives status: "Siparişiniz onay bekliyor — takip ediyoruz"
  - Order is NOT auto-cancelled — admin decides

### How Timeout Is Checked

- Background Edge Function runs on a schedule (every 5 minutes)
- Queries orders WHERE status = 'PENDING' AND created_at < now() - timeout_minutes
- Flags overdue orders and sends notifications

---

## 7. ACTOR PERMISSIONS PER STATE

| State | Merchant Can | Courier Can | Customer Can | Admin Can |
|---|---|---|---|---|
| PENDING | Accept, Reject | — | View, Cancel (future) | Cancel |
| CONFIRMED | Mark Ready, Cancel | — | View | Cancel |
| READY | Assign Courier, Cancel | — | View | Cancel |
| ASSIGNED | Unassign | Pickup (→ IN_TRANSIT) | View | Cancel |
| IN_TRANSIT | — | Deliver, Fail | View | — |
| FAILED_DELIVERY | Re-dispatch, Cancel | — | View | Cancel |
| DELIVERED | — | — | View, Rate (future) | — |
| REJECTED | — | — | View | — |
| CANCELLED | — | — | View | — |

---

## 8. EDGE FUNCTION: TRANSITION VALIDATION

Every state transition goes through a single Edge Function: `transition-order-status`

```
Input:
  - order_id: uuid
  - new_status: string
  - data: { courier_id?, rejection_reason?, failure_reason?, note? }

Validation:
  1. Fetch current order state
  2. Check: is transition valid? (from current → new_status)
  3. Check: is actor authorized for this transition?
  4. Check: required fields present? (reason for rejection/failure, courier_id for assignment)
  5. If all pass → execute transition
  6. If any fail → return error with specific reason

Execution:
  1. INSERT into order_status_log
  2. UPDATE orders.status = new_status
  3. SET relevant timestamp (accepted_at, delivered_at, etc.)
  4. SET relevant fields (courier_id, rejection_reason, etc.)
  5. Return updated order
```

---

## 9. POST-TRANSITION EFFECTS

| Transition | Side Effect |
|---|---|
| → CONFIRMED | Set `accepted_at`, notify customer |
| → REJECTED | Set `rejection_reason`, notify customer |
| → READY | Set `ready_at` |
| → ASSIGNED | Set `assigned_at`, set `courier_id`, notify courier |
| → IN_TRANSIT | Set `picked_up_at`, notify customer |
| → DELIVERED | Set `delivered_at`, notify customer, notify merchant |
| → FAILED_DELIVERY | Set `failure_reason`, notify merchant |
| → CANCELLED | Notify customer, notify courier (if assigned) |
| ASSIGNED → READY (unassign) | Clear `courier_id`, clear `assigned_at` |
