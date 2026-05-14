# ADMIN SYSTEM

## Platform Admin Specification

---

## 1. OVERVIEW

The Admin System provides platform-level oversight, merchant management, and operational control. In Phase 1, "admin" is the founding team. The admin panel is desktop-first (sidebar navigation).

---

## 2. CAPABILITIES

### 2.1 Merchant Onboarding

- Create new merchant account (name, slug, category, address, phone)
- Create owner auth account (email + temporary password)
- Assign merchant role to owner
- Activate / deactivate merchants
- View merchant details and configuration

### 2.2 Order Oversight

- View all orders across all merchants
- Filter by: merchant, status, date range, customer
- Override order state (emergency use — logged)
- Cancel stuck orders
- View order status history (full audit trail)

### 2.3 System Monitoring

- Active orders count (by status)
- Orders per hour/day (trend)
- Merchant response times (average time to accept)
- Timeout alerts (orders stuck in PENDING)
- Failed delivery rate
- System health indicators (Realtime connection count, Edge Function errors)

### 2.4 Merchant Management

- List all merchants (active/inactive)
- View merchant performance metrics:
  - Orders received / accepted / rejected
  - Average fulfillment time
  - Rejection rate
  - Active courier count
- Deactivate problematic merchants
- Reactivate merchants

### 2.5 Feature Flags (Phase 2+)

- Toggle features per merchant or globally
- Control rollout of new functionality
- A/B testing infrastructure

---

## 3. ADMIN ACTIONS AND LOGGING

Every admin action is logged in `order_status_log` (for order overrides) or a dedicated `admin_audit_log` table (for other actions).

| Action | Logged Data |
|---|---|
| Override order status | admin_id, order_id, from_status, to_status, reason |
| Activate merchant | admin_id, merchant_id, timestamp |
| Deactivate merchant | admin_id, merchant_id, reason, timestamp |
| Create merchant | admin_id, merchant_id, merchant_name, timestamp |

**Rule**: No admin action is invisible. All changes must be traceable.

---

## 4. DASHBOARD METRICS

### Real-time Panel

| Metric | Display |
|---|---|
| Active orders | Count badge, live updating |
| PENDING orders | Count with time-in-state indicator |
| Timed-out orders | Alert count (red) |
| Active merchants | Count of merchants with is_open = true |

### Daily Summary

| Metric | Calculation |
|---|---|
| Total orders today | COUNT where created_at = today |
| Delivery success rate | DELIVERED / (DELIVERED + FAILED + CANCELLED) |
| Average time to accept | AVG(accepted_at - created_at) |
| Average delivery time | AVG(delivered_at - created_at) |

---

## 5. ORDER OVERRIDE RULES

Admin can override order status, but with constraints:

| Override | Allowed? | Condition |
|---|---|---|
| Any → CANCELLED | Yes | Must provide reason |
| FAILED_DELIVERY → DELIVERED | Yes | Rare — confirmed delivery after mis-report |
| PENDING → CONFIRMED | No | Only merchant can accept |
| Any → PENDING | No | Cannot reverse to initial state |

Override requires:
1. Confirmation dialog with reason input
2. Logged to audit trail
3. Notification sent to affected actors (merchant, customer, courier)

---

## 6. WHAT ADMINS CANNOT DO

- Place orders on behalf of customers
- Operate as a merchant (fulfill orders)
- Edit product catalog (merchant's responsibility)
- Access customer payment methods (Phase 4)
- Delete any data (soft operations only)
- Act without logging

---

## 7. ADMIN AUTH

- Admin role is assigned manually in the database
- No self-service admin creation
- Admin uses service role key ONLY through Edge Functions
- Admin panel accessible at `/admin/*`
- Route protection in middleware verifies admin role
- RLS policies + service role key in functions provide actual security

---

## 8. INTERFACE DESIGN

Desktop-first sidebar layout:

```
┌─────────────────────────────────────────────────┐
│  SESTAKIBRIS Admin                              │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│  Dashboard│  [Content Area]                     │
│  Merchants│                                     │
│  Orders   │                                     │
│  System   │                                     │
│  Settings │                                     │
│           │                                     │
└───────────┴─────────────────────────────────────┘
```

---

## 9. PHASE EVOLUTION

| Phase | Addition |
|---|---|
| Phase 1 | Basic onboarding, order oversight, system health |
| Phase 2 | Merchant analytics, feature flags, self-service tools |
| Phase 3 | Courier pool management, zone configuration |
| Phase 4 | Payment reconciliation, commission management |
| Phase 5 | Platform economics dashboard, partner management |
