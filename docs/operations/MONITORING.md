# MONITORING

## What to Monitor and Alert On

---

## 1. OVERVIEW

Monitoring ensures the system is working before users report problems. The monitoring strategy covers three layers: infrastructure health, application metrics, and business KPIs.

---

## 2. INFRASTRUCTURE MONITORING

### Supabase

| Metric | Source | Alert Threshold |
|---|---|---|
| Database connection pool usage | Supabase Dashboard | > 80% capacity |
| Realtime active connections | Supabase Dashboard | > 80% of tier limit |
| Database disk usage | Supabase Dashboard | > 80% of plan |
| Edge Function error rate | Supabase Logs | > 5% in 5 min window |
| Edge Function latency (p95) | Supabase Logs | > 3000ms |
| Auth rate limiting triggered | Supabase Logs | Any occurrence |
| Storage usage | Supabase Dashboard | > 80% of plan |

### Vercel

| Metric | Source | Alert Threshold |
|---|---|---|
| Build failures | Vercel Dashboard | Any failure on main |
| Function timeout rate | Vercel Analytics | > 1% |
| Edge function cold starts | Vercel Analytics | Monitor trend |
| Bandwidth usage | Vercel Dashboard | > 80% of plan |

### Uptime

| Endpoint | Check Frequency | Alert If |
|---|---|---|
| Application homepage | Every 1 min | Unreachable for > 2 min |
| Supabase API | Every 1 min | 5xx for > 2 min |
| Edge Function health check | Every 5 min | Unreachable for > 5 min |

---

## 3. APPLICATION METRICS

### Order Flow Health

| Metric | Calculation | Alert Threshold |
|---|---|---|
| Orders created (hourly) | COUNT(orders WHERE created_at in hour) | < 50% of same-hour-yesterday during business hours |
| Order creation error rate | Failures / total attempts | > 5% |
| Average time in PENDING | AVG(now - created_at) WHERE status = PENDING | > 20 min (any single order) |
| Orders stuck in PENDING | COUNT WHERE PENDING > timeout | Any (immediate) |
| State transition error rate | Failed transitions / total attempts | > 3% |
| Delivery success rate (daily) | DELIVERED / (DELIVERED + FAILED + CANCELLED) | < 80% |

### Realtime Health

| Metric | Calculation | Alert Threshold |
|---|---|---|
| Active subscriptions | Supabase connection count | > 80% of tier |
| Subscription latency | Time from DB change to client receipt | > 5 seconds |
| Disconnection rate | Disconnects per hour | > 10% of active connections |

### Auth Health

| Metric | Calculation | Alert Threshold |
|---|---|---|
| Login failure rate | Failed logins / total attempts | > 20% |
| Token refresh failures | Failed refreshes / total attempts | > 5% |
| Account creation errors | Failed signups / total attempts | > 10% |

---

## 4. BUSINESS KPIs (Daily Monitoring)

### Platform Health

| KPI | Description | Concern Threshold |
|---|---|---|
| Daily active merchants | Merchants with at least 1 order today | Declining trend for 3+ days |
| Daily orders | Total orders created | < 50% of trailing 7-day average |
| Merchant acceptance rate | Confirmed / (Confirmed + Rejected) | < 80% platform-wide |
| Average fulfillment time | Order created → DELIVERED | > 60 minutes (during business hours) |
| Customer return rate | Customers with 2+ orders in 30 days | < 30% |
| New customer registrations | Daily new signups | Useful for trend, no alert |

### Merchant-Level Alerts

| Condition | Alert To | Action |
|---|---|---|
| Merchant has 3+ timed-out orders in a day | Admin | Contact merchant |
| Merchant rejection rate > 40% in a week | Admin | Investigate |
| Merchant has 0 orders for 7 days (was active) | Admin | Check if still operating |
| Courier failure rate > 30% for a merchant | Admin | Investigate courier quality |

---

## 5. CRON JOBS (Scheduled Checks)

| Job | Schedule | Function |
|---|---|---|
| Order timeout check | Every 5 minutes | Find PENDING orders past timeout → flag + alert |
| Daily metrics rollup | 02:00 AM daily | Calculate daily KPIs, store in metrics table |
| Inactive merchant detection | 09:00 AM daily | Flag merchants with no activity in 7 days |
| Push subscription cleanup | Weekly (Sunday 03:00 AM) | Remove expired/failed push subscriptions |

---

## 6. ALERTING CHANNELS

### Phase 1

| Channel | Used For |
|---|---|
| Email | Daily summary, P3/P4 alerts |
| Admin Dashboard | Real-time metrics, all alerts visible |
| Push Notification (to admin) | P1/P2 alerts |

### Phase 2+

| Channel | Used For |
|---|---|
| Slack/Discord | Team alerting, incident coordination |
| PagerDuty / Opsgenie | P1 on-call alerting |
| SMS | P1 critical (system down) |

---

## 7. LOG STRATEGY

### What to Log

| Event | Level | Retention |
|---|---|---|
| Order created | INFO | 90 days |
| State transition | INFO | 90 days |
| Transition rejected (invalid) | WARN | 90 days |
| Edge Function error | ERROR | 90 days |
| Auth failure | WARN | 30 days |
| RLS policy denial | WARN | 30 days |
| Admin action | INFO | Forever (audit) |
| System health check result | DEBUG | 7 days |

### Log Format

```json
{
  "timestamp": "2026-05-14T19:00:00.000Z",
  "level": "ERROR",
  "service": "create-order",
  "message": "Product not available",
  "context": {
    "merchant_id": "uuid",
    "product_id": "uuid",
    "customer_id": "uuid"
  },
  "trace_id": "uuid"
}
```

### Where Logs Live

| Source | Storage | Access |
|---|---|---|
| Edge Functions | Supabase Logs | Supabase Dashboard |
| Next.js API routes | Vercel Logs | Vercel Dashboard |
| Client errors | Reported to monitoring (Phase 2) | Admin Dashboard |
| Database audit (order_status_log) | PostgreSQL | SQL queries |

---

## 8. HEALTH CHECK ENDPOINT

### `/api/health` (public)

Returns system health status:

```json
{
  "status": "healthy",
  "timestamp": "2026-05-14T19:00:00Z",
  "services": {
    "database": "connected",
    "realtime": "connected",
    "storage": "connected"
  },
  "version": "1.0.0"
}
```

Used by:
- Uptime monitors (external)
- Admin dashboard
- Load balancer health checks

---

## 9. DASHBOARDS

### Admin Dashboard (Built-in)

Available at `/admin/system`:
- Live order count by status
- Error rate (last hour)
- Timed-out orders
- Active Realtime connections
- Last cron run status

### External Dashboards (Phase 2+)

| Tool | Purpose |
|---|---|
| Supabase Dashboard | Database, Auth, Storage metrics |
| Vercel Analytics | Web Vitals, function performance |
| Custom Grafana (Phase 3+) | Unified platform metrics |

---

## 10. PERFORMANCE BUDGETS

| Metric | Budget | Measured By |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Vercel Analytics |
| FID (First Input Delay) | < 100ms | Vercel Analytics |
| CLS (Cumulative Layout Shift) | < 0.1 | Vercel Analytics |
| Edge Function cold start | < 500ms | Supabase Logs |
| Edge Function execution | < 2000ms | Supabase Logs |
| Database query (95th percentile) | < 200ms | Supabase Dashboard |
| Realtime event delivery | < 1000ms | Application measurement |
| Page load (customer catalog) | < 3s on 3G | Lighthouse |
