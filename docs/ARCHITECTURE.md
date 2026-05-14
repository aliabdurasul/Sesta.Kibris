# ARCHITECTURE

## System Architecture Overview

---

## 1. HIGH-LEVEL SYSTEM DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS (PWA)                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Customer │  │ Merchant │  │ Courier  │  │  Admin   │      │
│  │   App    │  │Dashboard │  │   App    │  │  Panel   │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
└───────┼──────────────┼──────────────┼──────────────┼────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS (App Router)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Server Components (SSR)  │  API Routes (webhooks)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Client Components (Realtime subscriptions, interactions) │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────┬─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │    Auth    │  │  Realtime  │  │  Storage   │               │
│  │  (JWT +   │  │ (Postgres  │  │  (Product  │               │
│  │   Roles)  │  │  Changes)  │  │   Images)  │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│  ┌────────────┐  ┌─────────────────────────────┐               │
│  │   Edge     │  │    PostgreSQL Database       │               │
│  │ Functions  │  │    (RLS-enforced, shared     │               │
│  │ (Business  │  │     multi-tenant)            │               │
│  │  Logic)    │  │                              │               │
│  └────────────┘  └─────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼ (Phase 4)
┌─────────────────────────────────────────────────────────────────┐
│                    STRIPE CONNECT                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Platform Account → Connected Merchant Accounts        │    │
│  │  Payment processing, payouts, commissions              │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. LAYER RESPONSIBILITIES

### 2.1 Frontend Layer (Next.js)

| Responsibility | Description |
|---|---|
| Display | Renders state received from backend |
| Input collection | Gathers user input and sends to backend |
| Realtime rendering | Subscribes to Supabase Realtime for live updates |
| Form validation | Client-side validation for UX (not security) |
| Optimistic UI | Only where explicitly defined and reversible |

**The frontend MUST NOT**:
- Calculate order totals independently
- Determine order state transitions
- Store session-critical data in localStorage
- Make business decisions
- Contain mock or hardcoded business data

### 2.2 Backend Layer (Supabase)

| Component | Responsibility |
|---|---|
| PostgreSQL | Data persistence, RLS enforcement, constraints |
| Auth | Identity, JWT issuance, role claims |
| Edge Functions | Business logic, state transitions, calculations |
| Realtime | Event broadcasting to subscribed clients |
| Storage | Product images, receipts |

**The backend MUST NOT**:
- Trust frontend-supplied values for critical fields
- Allow undefined state transitions
- Allow cross-merchant data access
- Expose admin data to non-admin roles

### 2.3 Database Layer

- Single shared PostgreSQL database
- Multi-tenant isolation via RLS policies
- `merchant_id` as partition key on all merchant-owned tables
- Service role key used only in Edge Functions (never client-side)

---

## 3. DATA FLOW PATTERNS

### 3.1 Read Operations (Customer browsing catalog)

```
Customer Client → Next.js Server Component → Supabase (RLS-filtered query) → Response
```

- Server-side rendered for SEO and performance
- No Realtime subscription needed
- Cached where possible

### 3.2 Write Operations (Customer places order)

```
Customer Client → Next.js API Route / Edge Function → Validate → 
  Calculate totals → Snapshot address/prices → Insert order → 
  Trigger Realtime → Merchant Client receives notification
```

- All validation server-side
- Totals calculated from database prices (not client-supplied)
- Address and prices snapshotted at order time

### 3.3 Realtime Operations (Order state change)

```
Merchant Client → Edge Function (transition validated) → 
  Update orders table → ORDER_STATUS_LOG insert → 
  Supabase Realtime broadcasts → All subscribed clients update
```

- State machine validation before any write
- Log entry created before state field update
- Broadcast to: customer tracking, courier queue, admin dashboard

### 3.4 Auth Flow

```
User → Supabase Auth (email/password) → JWT issued (contains role claim) → 
  Client stores JWT → All API calls include JWT → 
  Supabase RLS evaluates role from JWT → Data filtered per policy
```

---

## 4. SECURITY BOUNDARIES

### 4.1 Authorization Model

```
┌─────────────────────────────────────────────┐
│              SECURITY LAYERS                 │
│                                             │
│  Layer 1: Supabase Auth (identity)          │
│  Layer 2: JWT Role Claims (authorization)   │
│  Layer 3: RLS Policies (data isolation)     │
│  Layer 4: Edge Function Logic (validation)  │
│                                             │
│  Frontend routing is NOT a security layer   │
└─────────────────────────────────────────────┘
```

### 4.2 Trust Boundaries

| Boundary | Rule |
|---|---|
| Client → Server | Never trust client-supplied totals, states, or actor IDs |
| Merchant → Merchant | RLS prevents any cross-merchant data access |
| Courier → Orders | Courier only sees orders assigned to them |
| Admin → System | Service role key restricted to Edge Functions |
| Frontend → State | Frontend displays state, never determines it |

---

## 5. URL NAMESPACE DESIGN

```
/                          → Landing page (public)
/[merchant-slug]           → Customer storefront (public)
/[merchant-slug]/cart      → Customer cart
/[merchant-slug]/order/[id]→ Customer order tracking
/customer/orders           → Customer order history (authenticated)
/customer/profile          → Customer profile

/merchant                  → Merchant dashboard (role: merchant)
/merchant/orders           → Order queue
/merchant/catalog          → Product management
/merchant/couriers         → Courier roster
/merchant/settings         → Store settings

/courier                   → Courier dashboard (role: courier)
/courier/deliveries        → Active deliveries
/courier/history           → Delivery history

/admin                     → Admin panel (role: admin)
/admin/merchants           → Merchant management
/admin/orders              → All orders
/admin/system              → System health
```

---

## 6. DEPLOYMENT ARCHITECTURE

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │     │   Supabase   │     │    Stripe    │
│              │     │              │     │  (Phase 4)   │
│  Next.js App │────▶│  Database    │     │              │
│  Edge CDN    │     │  Auth        │     │  Connect     │
│  Preview     │     │  Realtime    │     │  Platform    │
│  Deploys     │     │  Edge Fns    │     │              │
│              │     │  Storage     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       └────────────────────┘
         @supabase/ssr
```

### Environments

| Environment | Purpose | Database |
|---|---|---|
| Local | Developer machines | Supabase local (Docker) or linked project |
| Preview | PR previews on Vercel | Supabase staging project |
| Production | Live system | Supabase production project |

---

## 7. KEY ARCHITECTURAL DECISIONS

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js App Router | SSR for SEO, file-based routing for role namespaces, Vercel deployment |
| Backend | Supabase | Postgres + RLS + Auth + Realtime + Edge Functions in one platform |
| Auth | Supabase Auth (JWT) | Role claims in JWT, RLS integration, no external IdP needed |
| Realtime | Supabase Realtime | Sub-second latency for operational screens |
| Multi-tenancy | Shared DB + RLS | Operational simplicity, one schema, cross-merchant analytics for admin |
| Mobile | PWA | No app store dependency, single codebase, installable |
| Deployment | Vercel | Zero-config CI/CD, preview deploys, edge CDN |
| Payments (Phase 4) | Stripe Connect Express | Merchant payouts automated, commission-based |

---

## 8. WHAT THIS ARCHITECTURE DOES NOT SUPPORT (by design)

- Separate databases per merchant (unnecessary at current scale)
- Microservices (premature for Phase 1-3)
- GraphQL (REST + Supabase client is sufficient)
- Native mobile apps (PWA covers all use cases in Phase 1)
- Self-hosted infrastructure (managed services reduce ops burden)
- WebSocket servers outside Supabase (Supabase Realtime is sufficient)
