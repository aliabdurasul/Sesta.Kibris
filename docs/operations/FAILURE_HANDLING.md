# FAILURE HANDLING

## System and Operational Failure Responses

---

## 1. PRINCIPLE

Every failure mode must have a defined detection mechanism, response procedure, and escalation path. The system must never silently drop an order or leave an actor without a clear next step.

---

## 2. OPERATIONAL FAILURES

### F1: Merchant Does Not Respond to Order

| Property | Detail |
|---|---|
| Detection | Cron function checks PENDING orders older than timeout |
| Timeout | Configurable per merchant (default: 15 minutes) |
| Response | Flag order as timed out, alert admin |
| Customer sees | "Siparişiniz onay bekliyor — takip ediyoruz" |
| Admin action | Contact merchant, resolve or cancel |
| Auto-cancel? | NO — admin decides |

### F2: Merchant Rejects Order

| Property | Detail |
|---|---|
| Detection | Merchant action (explicit) |
| Response | Customer notified immediately with reason |
| Customer sees | "Siparişiniz reddedildi: {reason}" + "Yeniden sipariş verebilirsiniz" |
| Tracking | Rejection rate tracked per merchant, high rate → admin alert |

### F3: No Courier Available

| Property | Detail |
|---|---|
| Detection | Order sits in READY state without assignment |
| Response | This is merchant's responsibility in Phase 1 |
| Merchant sees | READY order without courier assignment |
| Resolution | Merchant assigns a courier or calls one manually |
| System action | None — no auto-assign in Phase 1 |

### F4: Customer Not Home at Delivery

| Property | Detail |
|---|---|
| Detection | Courier marks FAILED_DELIVERY with reason |
| Response | Merchant notified, decides next step |
| Options | Re-dispatch, cancel, contact customer |
| Customer sees | "Teslimat yapılamadı — mağaza sizinle iletişime geçecek" |

### F5: Wrong Address / Address Not Found

| Property | Detail |
|---|---|
| Detection | Courier marks FAILED_DELIVERY |
| Response | Merchant contacts customer for correction |
| Resolution | If corrected → re-dispatch; if not → cancel |

### F6: Courier Unresponsive After Assignment

| Property | Detail |
|---|---|
| Detection | Order stuck in ASSIGNED for extended time (no pickup) |
| Response | Merchant can unassign and reassign to another courier |
| System detection | Phase 2: alert if ASSIGNED > 30 minutes without pickup |

---

## 3. TECHNICAL FAILURES

### T1: Supabase Realtime Connection Drops

| Property | Detail |
|---|---|
| Detection | Client-side connection status monitoring |
| Response | Show disconnected indicator, auto-reconnect |
| Merchant sees | Red dot + "Bağlantı kesildi" banner |
| On reconnect | Re-fetch latest state to catch missed events |
| If persistent | Retry with exponential backoff, fallback to push notifications |

### T2: Edge Function Fails

| Property | Detail |
|---|---|
| Detection | Non-200 response from Edge Function |
| Response | Return structured error to client |
| Client shows | Turkish error message + retry option |
| Logging | Error logged in Supabase function logs |
| If critical (create-order) | Customer sees "Sipariş gönderilemedi — lütfen tekrar deneyin" |

### T3: Database Write Failure

| Property | Detail |
|---|---|
| Detection | PostgreSQL error during transaction |
| Response | Transaction rolled back, no partial state |
| Idempotency | Order creation uses idempotency key to prevent duplicates |
| Client sees | Generic error + retry |
| Admin alert | If error rate exceeds threshold (> 1% in 5 min) |

### T4: Auth Token Expires During Session

| Property | Detail |
|---|---|
| Detection | 401 response from Supabase |
| Response | Automatic refresh via `@supabase/ssr` middleware |
| If refresh fails | Redirect to login with "Oturum süreniz doldu" message |
| State preservation | Current URL preserved for redirect after re-auth |

### T5: Supabase Service Outage

| Property | Detail |
|---|---|
| Detection | Multiple failed API calls, Supabase status page |
| Response | Show maintenance message |
| Merchant sees | "Sistem geçici olarak kullanılamıyor — kısa süre içinde düzelecek" |
| Fallback | Merchants fall back to phone/WhatsApp (acceptable for brief outage) |
| Admin action | Monitor Supabase status, communicate ETA to merchants |

### T6: Vercel Deployment Failure

| Property | Detail |
|---|---|
| Detection | Vercel build/deploy error in CI |
| Response | Previous deployment remains active (zero downtime) |
| Resolution | Fix code, redeploy |
| User impact | None if previous version is stable |

---

## 4. DATA INTEGRITY FAILURES

### D1: Order Total Mismatch

| Property | Detail |
|---|---|
| Detection | Server calculation differs from sum of line items |
| Prevention | Total calculated server-side only, never from client |
| If detected | Log discrepancy, use server-calculated value |
| Impact | None if architecture is followed (server is authority) |

### D2: State Machine Violation Attempt

| Property | Detail |
|---|---|
| Detection | Edge Function validates before transition |
| Response | Reject with specific error code |
| Logging | Log invalid transition attempt (actor, from_state, to_state) |
| If systematic | Possible bug or attack, admin alert |

### D3: RLS Policy Bypass Attempt

| Property | Detail |
|---|---|
| Detection | PostgreSQL denies row access |
| Response | Empty result set or permission denied error |
| Logging | Supabase audit logs (Phase 2+) |
| Impact | None — RLS prevents data leak |

---

## 5. BUSINESS FAILURES

### B1: Merchant Goes Inactive Without Notice

| Property | Detail |
|---|---|
| Detection | No login for 7+ days with store still "open" |
| Response | Admin alert |
| Resolution | Admin contacts merchant, sets store to closed if unresponsive |
| Prevention | Auto-close after X days of inactivity (Phase 2) |

### B2: Consistently Failed Deliveries (> 30%)

| Property | Detail |
|---|---|
| Detection | Weekly metric calculation |
| Response | Admin alert, investigation |
| Resolution | Training, courier replacement, or merchant deactivation |

### B3: Customer Dispute (Wrong Items, Overcharging)

| Property | Detail |
|---|---|
| Detection | Customer contacts support (WhatsApp in Phase 1) |
| Response | Admin reviews order, contacts merchant |
| Resolution | Admin can cancel/override order state, mediate |
| Phase 2 | In-app dispute mechanism |

---

## 6. ESCALATION PATH

```
Level 1: System auto-handles (reconnect, retry, token refresh)
    │
    ▼ (if unresolved)
Level 2: User action (retry button, refresh, re-login)
    │
    ▼ (if unresolved)
Level 3: Admin alert (timed-out orders, high error rates)
    │
    ▼ (if unresolved)
Level 4: Manual intervention (admin override, merchant contact)
    │
    ▼ (if system-wide)
Level 5: Incident response (service outage, data integrity issue)
```

---

## 7. INCIDENT SEVERITY

| Severity | Definition | Response Time |
|---|---|---|
| P1 Critical | System down, no orders can be placed/fulfilled | Immediate |
| P2 High | Feature broken affecting active orders | < 1 hour |
| P3 Medium | Feature broken, workaround exists | < 4 hours |
| P4 Low | Cosmetic, non-blocking | Next business day |

---

## 8. POST-INCIDENT PROCESS

After any P1 or P2 incident:
1. Incident documented (what happened, timeline, impact)
2. Root cause identified
3. Fix deployed
4. Prevention measure implemented
5. Merchants/customers communicated with if affected
