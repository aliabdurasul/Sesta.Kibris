# SESTAKIBRIS SYSTEM BIBLE
### Version 1.0 — Founding Document
### Status: ACTIVE — Single Source of Truth

> *"One real merchant. One real order. End to end. Everything else is noise."*

---

## TABLE OF CONTENTS

1. [System Vision](#1-system-vision)
2. [Real-World Problem Definition](#2-real-world-problem-definition)
3. [Product Structure & Actors](#3-product-structure--actors)
4. [End-to-End Operation Flow](#4-end-to-end-operation-flow)
5. [System Architecture Rules](#5-system-architecture-rules)
6. [Tech Stack Decisions](#6-tech-stack-decisions)
7. [Database & Multi-Tenancy Model](#7-database--multi-tenancy-model)
8. [Order State Machine](#8-order-state-machine)
9. [Courier System Design](#9-courier-system-design)
10. [Business Model Evolution](#10-business-model-evolution)
11. [Payment Architecture (Future)](#11-payment-architecture-future)
12. [UI/UX System Design](#12-uiux-system-design)
13. [Landing Page Strategy](#13-landing-page-strategy)
14. [System Failure Risks](#14-system-failure-risks)
15. [Scale Strategy](#15-scale-strategy)

---

## 1. SYSTEM VISION

### 1.1 What SestaKibris IS

SestaKibris is a **hyperlocal commerce operating system** built for Northern Cyprus.

It is a multi-sided platform that connects:
- **Customers** who need groceries, water, and gas delivered
- **Merchants** who sell and fulfill those orders
- **Couriers** who move products from merchant to customer
- **Admins** who operate and scale the platform

SestaKibris replaces the informal, WhatsApp-based ordering systems that currently dominate local commerce in Turkish-speaking Northern Cyprus markets. It brings operational structure, transparency, and reliability to commerce that currently runs on trust, memory, and manual coordination.

SestaKibris is:
- A **merchant operating system** (order management, fulfillment, courier dispatch)
- A **customer ordering platform** (browse, order, track)
- A **courier dispatch system** (assignment, navigation, confirmation)
- An **admin control center** (merchant management, system health, data)

### 1.2 What SestaKibris Is NOT

SestaKibris is **NOT**:
- A social commerce platform (no feeds, no stories, no likes)
- A national e-commerce platform (no cross-region shipping, no warehouses)
- A food delivery platform (no restaurant menus, no meal prep, no kitchen logistics)
- A general marketplace (no third-party sellers, no auction logic)
- A payment processor (no direct money handling in Phase 1)
- A logistics network (couriers are merchant-owned in Phase 1)
- A WhatsApp replacement (it does not replicate chat — it replaces the need for it)

### 1.3 Core Philosophy

**Simplicity is the product.**

Every decision — technical, product, UX — must answer the question:
> *"Does this make it easier for one merchant to fulfill one real order today?"*

If the answer is no, the feature does not ship.

The following principles are non-negotiable:

| Principle | Rule |
|---|---|
| **Real-world first** | Build for how merchants actually work, not how we wish they worked |
| **Operational clarity** | Every actor must always know what to do next |
| **Minimum viable trust** | Customers must trust delivery will happen before they order |
| **WhatsApp-level friction** | If it's harder than sending a WhatsApp message, it will be abandoned |
| **No fake functionality** | No mock data in production, no buttons that do nothing, no UI lies |

### 1.4 Product Identity

SestaKibris is the **operating layer** for neighborhood commerce.

It does not aspire to be the Uber Eats of Northern Cyprus. It aspires to be the **invisible infrastructure** that makes local merchants dramatically more organized, reliable, and scalable — while making customers feel like their neighborhood store became a professional business overnight.

The brand promise to merchants: *"You take the orders. We handle the system."*
The brand promise to customers: *"Order from your neighborhood. Get it at the door."*

---

## 2. REAL-WORLD PROBLEM DEFINITION

### 2.1 Current State: The WhatsApp Dependency

The dominant ordering system in Northern Cyprus local commerce is WhatsApp. A customer messages a merchant, the merchant reads it, manually writes the order somewhere (or remembers it), calls the courier, and hopes for the best.

This system has worked because of small community trust. It is now breaking under demand.

**Concrete failure modes of WhatsApp ordering:**

| Failure | Impact |
|---|---|
| Message gets buried | Order is missed entirely |
| No confirmation to customer | Customer anxiety, repeat messages |
| Merchant manually retypes to courier | Errors, delays, miscommunication |
| No delivery address structure | Courier calls customer for location |
| No order status | Customer calls merchant multiple times |
| No order history | Disputes cannot be resolved |
| No inventory signal | Orders placed for out-of-stock items |
| Multiple chat threads | Merchant loses operational overview |
| No receipt | No formal record for either party |

### 2.2 Current State: Phone-Based Ordering

Many merchants still take orders by phone call. This compounds the WhatsApp problems with additional constraints:

- Merchant must be available and speaking at time of order
- No written record unless manually created
- Scale impossible — one phone line = one order at a time
- No searchable order history
- Merchant must relay entire order verbally to courier

### 2.3 Current State: Manual Delivery Coordination

Courier dispatch is done via phone calls and WhatsApp voice notes. There is no:
- Centralized job queue
- Route optimization
- Delivery confirmation mechanism
- Proof of delivery
- ETA visibility for customers

Couriers operate blind. Mistakes are common. Accountability is informal.

### 2.4 The Operational Inefficiency Loop

```
Customer sends WhatsApp → Merchant reads (maybe) → Merchant accepts (maybe) → 
Merchant calls courier → Courier goes to merchant → Courier calls customer for address → 
Courier delivers (maybe) → No confirmation → Customer calls to check → 
Merchant doesn't know → Everyone calls everyone
```

This loop is the problem SestaKibris solves.

### 2.5 Why This Matters Now

Northern Cyprus is experiencing rapid urbanization. Neighborhoods are growing. Merchant customer bases are expanding beyond personal networks. The informal trust-based system is failing not because people are dishonest — but because **volume exceeds human memory and manual coordination capacity**.

The merchants who survive the next 5 years will be the ones who become operationally professional without losing neighborhood warmth. SestaKibris is the tool that makes that possible.

---

## 3. PRODUCT STRUCTURE & ACTORS

### 3.1 The Four Actors

SestaKibris is built around four distinct actors. Every screen, every API, every database row must be designed with a clear actor in mind.

---

### 3.2 CUSTOMER

**Who they are:** Residents of Northern Cyprus who order groceries, water, and gas from local merchants.

**Primary motivation:** Receive reliable delivery without phone calls.

**Responsibilities:**
- Provide accurate delivery address
- Place clear, complete orders
- Be available at delivery time
- Pay on delivery (Phase 1)

**Actions:**
- Browse merchant catalog
- Add items to cart
- Specify delivery address and notes
- Submit order
- Track order status in real time
- View order history
- Rate delivery experience

**Limitations:**
- Cannot modify an order after merchant acceptance
- Cannot select a specific courier
- Cannot set future delivery scheduling (Phase 1)
- Cannot pay digitally (Phase 1)
- Cannot see merchant's internal operations

**Trust requirement:** The customer must trust the system before their first order. They have zero brand history with SestaKibris. The UI must communicate reliability, speed, and legitimacy instantly.

---

### 3.3 MERCHANT

**Who they are:** Owners or operators of grocery markets, water delivery services, or gas/tube sellers in Northern Cyprus.

**Primary motivation:** Receive organized orders, fulfill them efficiently, grow their business without operational chaos.

**Responsibilities:**
- Maintain accurate product catalog and inventory
- Accept or reject incoming orders promptly
- Coordinate order preparation
- Assign available couriers
- Keep operating hours accurate
- Communicate any delays proactively

**Actions:**
- Manage product catalog (add, edit, deactivate products)
- Set inventory levels
- View incoming order queue in real time
- Accept or reject orders (with reason)
- Mark orders as prepared
- Assign orders to couriers
- View order history and basic analytics
- Manage courier roster
- Set store open/closed status

**Limitations:**
- Cannot see other merchants' data
- Cannot modify customer information
- Cannot force payment collection (Phase 1)
- Cannot access platform-level analytics (only their own)
- Cannot create customer accounts

**Critical behavior rule:** A merchant who does not respond to an order within a defined timeout window must have the order auto-flagged. The system must never silently drop an order.

---

### 3.4 COURIER

**Who they are:** Delivery personnel employed by or contracted to a specific merchant. In Phase 1, all couriers belong to a merchant.

**Primary motivation:** Complete deliveries efficiently with minimal friction.

**Responsibilities:**
- Accept assigned delivery jobs
- Pick up prepared orders from merchant
- Deliver to correct address
- Confirm delivery with customer
- Report problems immediately

**Actions:**
- View assigned delivery queue
- View delivery address and order details
- Navigate to customer address
- Confirm delivery completion
- Report failed delivery (customer not home, wrong address, etc.)
- View delivery history

**Limitations:**
- Cannot create or modify orders
- Cannot assign themselves to orders (merchant assigns)
- Cannot see other merchants' data
- Cannot access customer payment information
- Cannot see orders not assigned to them

**Phase 1 constraint:** Couriers are tied to one merchant. They cannot be shared across merchants.

---

### 3.5 ADMIN

**Who they are:** SestaKibris platform operators. Initially this is the founding team.

**Primary motivation:** Ensure the platform is running, merchants are onboarded correctly, and real orders are flowing.

**Responsibilities:**
- Onboard and verify merchants
- Monitor platform health
- Resolve disputes
- Manage system configuration
- View cross-merchant analytics
- Handle merchant support

**Actions:**
- Create and configure merchant accounts
- Activate/deactivate merchants
- View all orders across all merchants
- Override order states when necessary
- View platform-wide metrics
- Manage feature flags
- Access system logs

**Limitations:**
- Cannot place orders on behalf of customers
- Cannot operate as a merchant (no order fulfillment from admin panel)
- Admin actions must be logged — no invisible changes

---

## 4. END-TO-END OPERATION FLOW

### 4.1 The Complete Order Lifecycle

```
[CUSTOMER] Browse Catalog
        ↓
[CUSTOMER] Add to Cart
        ↓
[CUSTOMER] Submit Order (with address, notes)
        ↓
[SYSTEM]  Order Created → State: PENDING
        ↓
[MERCHANT] Receives real-time notification
        ↓
  ┌─────────────────────────────────────┐
  │ MERCHANT DECISION POINT             │
  │ Accept → State: CONFIRMED           │
  │ Reject → State: REJECTED + reason   │
  └─────────────────────────────────────┘
        ↓ (if CONFIRMED)
[MERCHANT] Prepares order
        ↓
[MERCHANT] Marks order as prepared → State: READY
        ↓
[MERCHANT] Assigns courier → State: ASSIGNED
        ↓
[COURIER] Picks up order → State: IN_TRANSIT
        ↓
[COURIER] Arrives at customer address
        ↓
  ┌────────────────────────────────────────────┐
  │ DELIVERY DECISION POINT                    │
  │ Successful → State: DELIVERED              │
  │ Failed → State: FAILED_DELIVERY + reason   │
  └────────────────────────────────────────────┘
        ↓ (if DELIVERED)
[SYSTEM] Order complete → triggers post-delivery flow
[CUSTOMER] Receives confirmation, can rate experience
```

### 4.2 State Transition Summary

| From State | To State | Actor | Trigger |
|---|---|---|---|
| — | PENDING | Customer | Order submitted |
| PENDING | CONFIRMED | Merchant | Merchant accepts |
| PENDING | REJECTED | Merchant | Merchant rejects |
| CONFIRMED | READY | Merchant | Order prepared |
| READY | ASSIGNED | Merchant | Courier assigned |
| ASSIGNED | IN_TRANSIT | Courier | Pickup confirmed |
| IN_TRANSIT | DELIVERED | Courier | Delivery confirmed |
| IN_TRANSIT | FAILED_DELIVERY | Courier | Delivery failed |
| FAILED_DELIVERY | IN_TRANSIT | Merchant | Re-dispatch decision |
| Any (except DELIVERED) | CANCELLED | Admin / Merchant | Override required |

### 4.3 Failure Cases

**F1: Merchant Does Not Respond**
- Timeout window: 15 minutes (configurable per merchant)
- System auto-notifies merchant (push + in-app)
- At 15 minutes: order flagged as PENDING_TIMEOUT
- Admin alerted
- Customer receives status: "Order pending confirmation — we're following up"
- Do NOT auto-cancel silently

**F2: Merchant Rejects Order**
- Customer notified immediately with rejection reason
- Order moves to REJECTED state
- Customer sees clear message: reason, no penalty, can reorder
- Merchant rejection rate tracked by admin

**F3: No Courier Available**
- Order sits in READY state
- Merchant must resolve (assign a courier or call one manually)
- System does not auto-assign in Phase 1
- This is a merchant operational responsibility in Phase 1

**F4: Customer Not Home at Delivery**
- Courier marks as FAILED_DELIVERY with reason: "Customer not home"
- Merchant notified
- Merchant decides: retry, cancel, or contact customer
- No automatic penalty in Phase 1

**F5: Wrong Address**
- Courier marks as FAILED_DELIVERY with reason: "Address not found"
- System flags order for review
- Merchant contacts customer to correct address
- Re-dispatch if corrected

**F6: System Downtime During Active Order**
- All in-progress order states are persisted in the database before any UI update
- On reconnect, system resumes from last persisted state
- Merchants and couriers can operate with stale UI until reconnect; no data is lost
- Admin dashboard shows system health status

### 4.4 Edge Cases

**E1: Customer orders from a closed merchant**
- System prevents order submission when merchant is marked CLOSED
- Customer sees: "This store is currently closed"

**E2: Item goes out of stock after order placed**
- Merchant accepts order, then removes item from catalog
- Merchant must handle via order notes or direct contact in Phase 1
- Phase 2: partial order fulfillment system introduced

**E3: Customer submits duplicate order**
- System detects identical order from same customer to same merchant within 5 minutes
- Warning shown: "You recently placed a similar order. Continue?"
- Not auto-blocked — customer confirms

**E4: Courier is assigned to multiple active deliveries**
- Phase 1: allowed — merchant manages their courier's capacity
- System shows courier's current active delivery count as a warning
- No hard limit in Phase 1; merchant decides

**E5: Order value is zero**
- System must validate: cart total must be greater than zero before submission
- This is a hard frontend and backend validation

---

## 5. SYSTEM ARCHITECTURE RULES

### 5.1 Frontend Responsibilities

The frontend is a **display and interaction layer only**. It:

- Renders state received from the backend
- Collects user input and sends it to the backend
- Shows real-time updates via Supabase Realtime subscriptions
- Handles optimistic UI only where explicitly defined and reversible
- Validates form inputs for user experience (not for business logic)

The frontend **MUST NOT**:
- Calculate order totals independently (backend calculates)
- Determine order state transitions (backend determines)
- Store session-critical data in localStorage or sessionStorage
- Make business decisions (e.g., "should this order be accepted?")
- Contain mock or hardcoded business data
- Assume the backend is correct — always handle loading, error, and empty states

### 5.2 Backend Responsibilities

The backend (Supabase + Edge Functions) is the **single source of truth**. It:

- Owns all business logic
- Owns all state transitions
- Validates every input before persisting
- Enforces all authorization rules via Row Level Security
- Calculates all financial values
- Owns the order state machine

The backend **MUST NOT**:
- Trust frontend-supplied values for critical fields (totals, states, actor IDs)
- Allow state transitions that are not defined in the state machine
- Allow cross-merchant data access at the row level
- Expose admin-only data to merchant or customer roles

### 5.3 Source of Truth Rules

| Data | Source of Truth |
|---|---|
| Order state | Supabase `orders` table |
| Product prices | Supabase `products` table |
| Order total | Calculated by backend on order creation |
| User identity | Supabase Auth |
| Merchant configuration | Supabase `merchants` table |
| Courier assignment | Supabase `orders` table (assigned_courier_id) |
| Delivery confirmation | Supabase `orders` table (delivered_at timestamp) |

### 5.4 What MUST NOT Exist in the System

These are absolute prohibitions. Any PR that introduces these must be rejected:

| Prohibited Pattern | Reason |
|---|---|
| Business logic in localStorage | Not reliable, not shared, not secure |
| Order state stored in React state only | Lost on refresh, inconsistent across actors |
| Fake "loading" spinners that skip actual calls | Destroys trust |
| Buttons that visually work but don't save | Users will lose data |
| Hardcoded prices or product data | Will diverge from reality |
| Shared authentication sessions across merchants | Data isolation catastrophe |
| Client-side calculation of order totals shown as final | Fraud surface, UX inconsistency |
| Status updates via polling only without Realtime | 30-second delays kill operational utility |
| Admin access controlled only by frontend routing | Security theater |

### 5.5 Real-Time Architecture Rule

Any event that one actor triggers and another actor must see **immediately** must flow through Supabase Realtime subscriptions — not periodic polling.

This includes:
- New order → Merchant sees it
- Order accepted → Customer sees it
- Order assigned to courier → Courier sees it
- Order in transit → Customer sees updated status
- Order delivered → Merchant sees completion

---

## 6. TECH STACK DECISIONS

### 6.1 Frontend: Next.js (App Router)

**Why Next.js:**
- Production-grade React framework with file-based routing, which maps cleanly to role-based URL namespaces (`/merchant/orders`, `/customer/track`, `/courier/deliveries`)
- Server-side rendering for customer-facing catalog pages improves SEO and initial load performance
- API routes provide a clean integration surface for webhooks and third-party services without a separate backend service
- Excellent Supabase SSR integration via `@supabase/ssr`
- Vercel deployment gives zero-config CI/CD, preview deployments per PR, and edge CDN

**Why NOT create-react-app or Vite SPA:**
- No SSR capability means poor SEO for public catalog pages
- More complex deployment setup for production

**Why NOT a separate mobile app (Phase 1):**
- Progressive Web App via Next.js covers mobile use cases
- No app store approval dependency
- Single codebase for all actors
- Merchant and courier apps in Phase 1 are PWA-installable web apps

### 6.2 Backend: Supabase

**Why Supabase:**
- Postgres at the core — a real, battle-tested relational database. This is not a toy.
- Row Level Security (RLS) built into Postgres means authorization lives in the database, not scattered across application code
- Built-in Auth with JWT supports multiple roles without external identity provider setup
- Realtime is first-class — Postgres changes broadcast to subscribed clients with sub-second latency
- Edge Functions for business logic that cannot live in the frontend
- Storage for product images
- Single platform eliminates the operational overhead of managing separate services

**Why NOT Firebase:**
- NoSQL document model is hostile to relational commerce data (orders → items → products → merchants)
- Realtime data consistency guarantees are weaker
- RBAC/Security Rules are harder to audit than Postgres RLS
- Vendor lock-in is deeper

**Why NOT a custom Express/Node backend:**
- Massive infrastructure overhead for Phase 1
- Auth, realtime, storage, and database would each need separate implementation and hosting
- Speed of execution is critical; Supabase provides 80% of what we need out of the box

### 6.3 Realtime Strategy

Supabase Realtime is used for **operational screens only** — not for every piece of UI.

| Screen | Strategy |
|---|---|
| Merchant order queue | Realtime subscription on `orders` table for their `merchant_id` |
| Customer order tracking | Realtime subscription on specific `order_id` |
| Courier delivery queue | Realtime subscription on `orders` where `courier_id` = their ID |
| Admin dashboard | Realtime subscription on platform-wide `orders` aggregates |
| Product catalog | Server-side rendered + cached; no realtime needed |

Realtime is a **feature**, not a default. Every subscription must have a defined unsubscribe lifecycle.

### 6.4 Auth Strategy

Supabase Auth with JWT-based sessions.

**Role model:**
- `customer` — default role for all sign-ups
- `merchant` — assigned by admin during onboarding
- `courier` — created by merchant, sub-account of merchant
- `admin` — platform operator, assigned manually in database

**Session strategy:**
- JWTs contain role claim, used by Supabase RLS policies
- Merchant and courier sessions are separate — a courier cannot elevate to merchant
- No shared sessions between actors
- Password-based auth in Phase 1; OTP/magic link in Phase 2

**Multi-tenant auth rule:**
A merchant can only see their own data. This is enforced at the RLS layer, not at the application layer. The application layer is an additional convenience — not the security boundary.

---

## 7. DATABASE & MULTI-TENANCY MODEL

### 7.1 Core Tables

```
MERCHANTS
  - id (uuid, pk)
  - name
  - slug (unique, used for storefront URL)
  - category (grocery | water | gas)
  - owner_user_id (fk → auth.users)
  - is_active (bool)
  - is_open (bool)
  - address
  - phone
  - created_at

PRODUCTS
  - id (uuid, pk)
  - merchant_id (fk → merchants)
  - name
  - description
  - price (integer, in lowest currency unit)
  - unit (e.g., "19L", "kg", "adet")
  - stock_count (nullable — null means unlimited)
  - is_available (bool)
  - image_url
  - display_order
  - created_at

CUSTOMERS
  - id (uuid, pk, fk → auth.users)
  - full_name
  - phone
  - created_at

CUSTOMER_ADDRESSES
  - id (uuid, pk)
  - customer_id (fk → customers)
  - label (e.g., "Home", "Work")
  - address_line
  - district
  - notes
  - is_default (bool)

COURIERS
  - id (uuid, pk)
  - merchant_id (fk → merchants)
  - user_id (fk → auth.users)
  - full_name
  - phone
  - is_active (bool)
  - created_at

ORDERS
  - id (uuid, pk)
  - merchant_id (fk → merchants)
  - customer_id (fk → customers)
  - courier_id (fk → couriers, nullable)
  - status (enum — see State Machine)
  - total_amount (integer)
  - delivery_address (jsonb snapshot — NOT a foreign key)
  - customer_notes
  - merchant_notes
  - rejection_reason
  - failure_reason
  - created_at
  - accepted_at
  - ready_at
  - assigned_at
  - picked_up_at
  - delivered_at

ORDER_ITEMS
  - id (uuid, pk)
  - order_id (fk → orders)
  - product_id (fk → products)
  - product_name (snapshot — NOT dynamic lookup)
  - unit_price (snapshot)
  - quantity
  - line_total (integer)

ORDER_STATUS_LOG
  - id (uuid, pk)
  - order_id (fk → orders)
  - from_status
  - to_status
  - actor_id (user who triggered)
  - actor_role
  - note
  - created_at
```

### 7.2 Critical Design Decisions

**Delivery address is a JSON snapshot, not a foreign key.**
When an order is placed, the delivery address is copied into `orders.delivery_address` as a snapshot. If the customer later edits or deletes an address, the historical order still shows the correct delivery address. This is non-negotiable.

**Product price and name are snapshotted in ORDER_ITEMS.**
`product_name` and `unit_price` are copied at order creation time. If the merchant changes a product price later, old orders still show the correct historical price. This is non-negotiable.

**ORDER_STATUS_LOG is append-only.**
Every state transition is logged. No log entry is ever deleted. This is the audit trail.

### 7.3 Merchant Isolation Logic

Every table that belongs to a merchant includes `merchant_id`.

RLS policies enforce:
- A merchant can SELECT, INSERT, UPDATE only rows where `merchant_id = auth.uid()` → resolved to their merchant record
- A customer can SELECT only orders where `customer_id = auth.uid()`
- A courier can SELECT only orders where `courier_id = auth.uid()` → resolved to their courier record
- An admin bypasses RLS via a service role key (used only in Edge Functions, never exposed to client)

**Rule:** No application-level WHERE clause is a substitute for RLS. RLS is the last line of defense. Application WHERE clauses are performance optimizations, not security.

### 7.4 Multi-Tenancy Model

SestaKibris uses a **shared database, isolated by RLS** model (not separate databases or schemas per merchant).

This is correct for Phase 1 through Phase 3 because:
- Operational simplicity — one database to manage
- RLS provides genuine data isolation without schema complexity
- Cross-merchant analytics for admin are straightforward
- Migration and schema changes apply once

When to reconsider: if a single merchant generates > 1M orders/month, evaluate dedicated schema or read replica. This is not a Phase 1, 2, or 3 concern.

---

## 8. ORDER STATE MACHINE

### 8.1 All Order States

| State | Meaning |
|---|---|
| `PENDING` | Order submitted by customer, awaiting merchant action |
| `CONFIRMED` | Merchant has accepted the order |
| `REJECTED` | Merchant has rejected the order (terminal) |
| `READY` | Merchant has prepared the order, awaiting courier |
| `ASSIGNED` | Courier has been assigned to this order |
| `IN_TRANSIT` | Courier has picked up and is en route |
| `DELIVERED` | Courier confirmed delivery (terminal — success) |
| `FAILED_DELIVERY` | Courier could not complete delivery |
| `CANCELLED` | Order cancelled by admin or merchant before delivery |

### 8.2 Valid Transitions

```
PENDING         → CONFIRMED         (actor: merchant)
PENDING         → REJECTED          (actor: merchant)
PENDING         → CANCELLED         (actor: admin only)
CONFIRMED       → READY             (actor: merchant)
CONFIRMED       → CANCELLED         (actor: merchant, admin)
READY           → ASSIGNED          (actor: merchant)
READY           → CANCELLED         (actor: merchant, admin)
ASSIGNED        → IN_TRANSIT        (actor: courier)
ASSIGNED        → READY             (actor: merchant — unassign courier)
IN_TRANSIT      → DELIVERED         (actor: courier)
IN_TRANSIT      → FAILED_DELIVERY   (actor: courier)
FAILED_DELIVERY → IN_TRANSIT        (actor: merchant — re-dispatch)
FAILED_DELIVERY → CANCELLED         (actor: merchant, admin)
```

### 8.3 Invalid Transitions (MUST be rejected by backend)

| Attempted Transition | Reason |
|---|---|
| DELIVERED → anything | Terminal state. Cannot be undone |
| REJECTED → anything | Terminal state. Cannot be undone |
| PENDING → IN_TRANSIT | Must go through CONFIRMED and READY |
| PENDING → DELIVERED | Must follow full lifecycle |
| CONFIRMED → IN_TRANSIT | Courier must be assigned first |
| READY → DELIVERED | Courier must be assigned and in transit |
| IN_TRANSIT → ASSIGNED | Cannot go backwards through assignment |
| Customer → any transition | Customers do not transition order states |

### 8.4 State Machine Rules

1. **Every transition is persisted to ORDER_STATUS_LOG before the state field is updated.**
2. **Backend validates actor role for every transition.** A courier cannot accept an order. A customer cannot mark an order as delivered.
3. **Timestamps are set by the server, not the client.** `accepted_at`, `delivered_at`, etc. are set via `now()` in Supabase, never from the frontend clock.
4. **No state can be skipped.** The flow is linear except for the failure/re-dispatch loop.
5. **Terminal states are immutable.** DELIVERED and REJECTED rows cannot be updated after reaching that state.

---

## 9. COURIER SYSTEM DESIGN

### 9.1 Phase 1: Merchant-Owned Couriers

In Phase 1, all couriers are created and managed by their merchant.

**Model:**
- Merchant creates courier accounts in their dashboard
- Courier logs in with their own credentials
- Courier only sees orders assigned to them by their merchant
- Merchant assigns orders to couriers manually
- Merchant manages their courier roster (active/inactive)

**Why this is correct for Phase 1:**
- Zero platform liability for courier management
- Merchants already have existing courier relationships
- No matching algorithm needed
- Operational trust is maintained within existing merchant–courier relationship
- Fast to implement and validate

**Courier onboarding by merchant:**
1. Merchant enters courier's name and phone in dashboard
2. System creates courier account with temporary credentials
3. Courier installs PWA and logs in
4. Merchant can deactivate courier at any time

### 9.2 Dispatch Logic in Phase 1

Dispatch is **manual and merchant-controlled.**

When an order reaches READY state:
- Merchant sees their available (not currently assigned) couriers
- Merchant selects a courier and assigns the order
- Courier receives a real-time notification on their device
- Courier confirms pickup when they collect the order

There is no algorithm. There is no auto-assignment. The merchant is the dispatcher.

**Why no algorithm in Phase 1:**
Algorithms require data to optimize. In Phase 1, we have no delivery performance data, no GPS data, no route history. Auto-assignment built on no data will be wrong. The merchant's judgment is more reliable in Phase 1.

### 9.3 Courier App (PWA) — Phase 1 Scope

The courier interface is minimal by design:

- **My Deliveries:** List of assigned orders with status
- **Order Detail:** Customer address, items, notes, contact
- **Action Buttons:** "I've Picked Up" → "Delivered" / "Failed"
- **Delivery History:** Last 7 days

No map integration in Phase 1. Couriers navigate using device maps (Apple Maps / Google Maps link from address).

### 9.4 Phase 2: Courier Performance Tracking

- Delivery success rate per courier
- Average delivery time per courier
- Merchant rating of courier
- Begin collecting data for Phase 3 auto-dispatch

### 9.5 Phase 3: Platform Couriers (Future Design)

In Phase 3, SestaKibris may introduce a shared courier pool across merchants.

**Design principles for this future state:**
- Couriers can register on the platform directly (not via merchant)
- Courier has a profile, rating, and active status
- Orders can be offered to available platform couriers when merchant's own couriers are unavailable
- Platform couriers are paid via Stripe Connect
- Merchant retains option to use own couriers first (preference setting)
- Zone-based courier availability (not GPS-dependent in early version)

**This is NOT Phase 1 or Phase 2 work. Do not pre-implement.**

---

## 10. BUSINESS MODEL EVOLUTION

### 10.1 Phase 1: Validation (Months 1–6)

**Goal:** Prove that a real merchant can receive and fulfill real orders.

**Business model:**
- **Free for all merchants**
- **Cash on delivery only** — no payment processing
- **Zero platform fees**

**Why free:**
- Removes all friction from merchant adoption
- Price objections kill early sales conversations
- SestaKibris needs live operational data more than revenue right now
- One merchant using it every day is worth more than 10 merchants who tried it once

**What to measure:**
- Orders placed per day per merchant
- Merchant acceptance rate
- Successful delivery rate
- Customer return rate (second order within 30 days)
- Time from order to delivery

**Phase 1 success criteria:**
- 3+ merchants with 10+ orders per week each
- >85% successful delivery rate
- >40% customer return rate within 30 days
- Zero critical system failures causing merchant data loss

### 10.2 Phase 2: SaaS Monetization (Months 7–18)

**Goal:** Generate sustainable revenue from proven value.

**Business model:**
- Monthly SaaS subscription per merchant
- Tiered pricing based on order volume or feature access
- Free tier retained for very small/dormant merchants (product-led growth)

**Pricing philosophy:**
- Price must be below the cost of a single missed order due to WhatsApp chaos
- Merchants must feel they are saving money, not spending money
- Annual subscription with discount available from launch

**Suggested tier structure (to be validated):**

| Tier | Monthly Price | Order Limit | Couriers |
|---|---|---|---|
| Starter | Free | 50 orders/mo | 1 |
| Growth | TBD | 500 orders/mo | 5 |
| Pro | TBD | Unlimited | Unlimited |

**Phase 2 additions:**
- Analytics dashboard for merchants
- Customer CRM (order history per customer)
- Inventory management
- Promotional tools (e.g., featured products)

### 10.3 Phase 3: Commission + Stripe Connect (Months 18–36)

**Goal:** Capture value from transaction flow.

**Business model:**
- SaaS subscription continues as baseline
- Online payment enabled via Stripe Connect
- Platform takes a commission on digital transactions (e.g., 1–2%)
- Couriers on platform can receive digital payouts

**Why wait for Phase 3:**
- COD is culturally dominant in Northern Cyprus — forcing online payment in Phase 1 increases friction
- Trust must be established before customers share payment information
- Stripe Connect setup requires business entity formation and regulatory compliance
- Technical complexity is significant; must not dilute Phase 1 focus

### 10.4 Phase 4: Platform Scale (Year 3+)

**Goal:** Become the commerce infrastructure layer for all of Northern Cyprus.

**Business model additions:**
- B2B wholesale ordering (restaurants, hotels buying from markets)
- Advertising/featured placement for merchants
- Platform courier network (shared courier pool)
- Data products (aggregate market intelligence for suppliers and distributors)
- Potential white-label offering for other markets

**This is a vision, not a roadmap. Do not pre-build.**

---

## 11. PAYMENT ARCHITECTURE (FUTURE)

### 11.1 Stripe Connect Design Concept

When digital payments are introduced, SestaKibris will function as a **Stripe Connect Platform** with merchants as Connected Accounts.

**Flow concept:**
1. Customer pays at checkout via Stripe
2. Payment is held by the SestaKibris Stripe platform account
3. Upon delivery confirmation, funds are automatically routed:
   - Merchant receives their amount (order total minus commission)
   - SestaKibris retains commission
4. Payouts follow Stripe's standard payout schedule to merchant bank account

**Connected Account type:** Stripe Express Accounts (merchants do not need to manage Stripe directly; SestaKibris handles the payment UX)

### 11.2 Payout Logic Concept

- Payout is triggered by `DELIVERED` status transition
- Payout is NOT triggered manually — it is automated
- Refund logic: if order is CANCELLED after payment, full refund to customer
- Partial refunds (partial order fulfillment): handled in Phase 3 design, not now

### 11.3 Commission Structure Concept

- Commission is calculated as a percentage of order total
- Commission rate is configurable per merchant tier
- Commission is deducted from payout, not added to customer price
- All commission rates are transparent to the merchant

**IMPORTANT:** This section describes architecture intent only. No payment code exists in the system until Phase 3. The only financial record in Phase 1 is the `total_amount` field on the order, which is a reference for COD collection only.

---

## 12. UI/UX SYSTEM DESIGN

### 12.1 Mobile-First Principle

SestaKibris is built for a user holding a phone while doing something else.

- All critical interactions must be completable one-handed
- Touch targets: minimum 44×44px for any tappable element
- Primary actions are at the bottom of the screen (thumb reach zone)
- Destructive actions (reject order, cancel) require confirmation
- Notifications must be actionable without opening the app

Desktop is a secondary surface for merchants managing their catalog and viewing analytics. The operational flow (accepting orders, managing deliveries) happens primarily on mobile.

### 12.2 Navigation System

**Customer App:**
```
Bottom Tab Bar:
  [Home / Catalog] [My Orders] [Profile]
```

**Merchant App:**
```
Bottom Tab Bar:
  [Orders] [Catalog] [Couriers] [Settings]
```

**Courier App:**
```
Bottom Tab Bar:
  [My Deliveries] [History]
```

**Admin Panel:**
```
Sidebar (desktop-first):
  [Dashboard] [Merchants] [Orders] [System] [Settings]
```

Rule: Navigation must never change based on order state. The nav is stable. Content within tabs changes.

### 12.3 Screen Hierarchy

**Customer Critical Path (must be frictionless):**
```
Merchant Storefront → Product Catalog → Cart → Address → Confirm → Tracking
```
This path must be completable in under 90 seconds on first use.

**Merchant Critical Path (must be instant):**
```
Order Notification → Order Detail → Accept/Reject → Mark Ready → Assign Courier
```
A merchant must be able to accept an incoming order in under 10 seconds.

**Courier Critical Path (must be idiot-proof):**
```
Delivery Notification → Order Detail (address + items) → Picked Up → Delivered
```
A courier must never be confused about what to do next.

### 12.4 Button Placement Logic

| Context | Rule |
|---|---|
| Primary action | Full-width button, bottom of screen, high contrast color |
| Destructive action | Secondary button, requires confirmation modal |
| Order state actions | Only show valid next-state actions — never show invalid options |
| Empty states | Always include a clear primary action to resolve the empty state |
| Loading states | Disable primary action button during async operations; show spinner inside button |

### 12.5 Merchant UX vs Customer UX

**Merchant UX is about speed and control:**
- Dense information displays acceptable
- Multiple actions visible at once
- Order queue is the home screen
- New orders should feel urgent (color, sound, vibration)
- Errors must be visible and specific, not generic

**Customer UX is about confidence and clarity:**
- Clean, spacious layouts
- Single action per screen where possible
- Status must be human-readable ("Your order is being prepared" not "Status: CONFIRMED")
- No dead ends — every error screen must have a next step

### 12.6 Simplicity Rules

1. **Never show a user something they cannot act on.** If a merchant can't do anything about a DELIVERED order, it should be archived — not shown in the active queue.
2. **Status language must be human, not technical.** Translate all system states to plain Turkish-language descriptions.
3. **One screen, one job.** Avoid screens that try to do more than one thing.
4. **Empty states are features.** "You have no orders yet" should include guidance on how to get the first order.
5. **Errors must tell users what to do.** "Something went wrong" is not an error message.

### 12.7 WhatsApp-Level UX Philosophy

WhatsApp works because:
- Opening it is instant
- Sending a message takes 3 taps
- You know if it was delivered
- You get notified immediately when something happens

SestaKibris must match this:
- App must load to operational state in under 2 seconds
- Placing an order should take under 5 taps after first use
- Order delivery must be confirmed — the customer must know
- Notifications must be immediate and meaningful

If SestaKibris is slower or harder than WhatsApp, we will lose to WhatsApp. That is the standard.

---

## 13. LANDING PAGE STRATEGY

### 13.1 Purpose of the Landing Page

The landing page has exactly two jobs:
1. Convince a skeptical local merchant that SestaKibris is worth 20 minutes of their time
2. Collect their phone number for a demo/onboarding call

Nothing else. No feature tours. No pricing tables. No blog. No integrations page.

### 13.2 Messaging Strategy

**Primary headline:**
> WhatsApp siparişlerine son. Siparişlerinizi sisteme alın.
> *(End WhatsApp orders. Put your orders into a system.)*

**Why this works:** It names the exact pain. Every local merchant immediately recognizes the problem.

**Supporting message:**
> Müşterileriniz sipariş versin. Siz sadece hazırlayın. Kurye götürsün. Hepsi bu.
> *(Let your customers place orders. You just prepare them. The courier delivers. That's it.)*

**What NOT to say:**
- "AI-powered" — irrelevant to this audience
- "Scalable platform" — meaningless
- "Enterprise-grade" — creates fear, not confidence
- Technical jargon of any kind

### 13.3 Conversion Structure

```
[Hero: Headline + single CTA]
        ↓
[Pain Section: 3 specific WhatsApp problems they recognize]
        ↓
[Solution: How it works in 3 steps]
        ↓
[Social Proof: First merchant testimonial — real name, real photo, real quote]
        ↓
[CTA: "Bize ulaşın" (Contact Us) + phone / WhatsApp button]
```

Rule: The page must work if the visitor only reads the hero section and calls. Every additional section is a conversion opportunity for the undecided visitor.

### 13.4 Trust Building

In a small market like Northern Cyprus, trust is personal.

- Use real merchant photos and names in testimonials (no stock photos, ever)
- Show the founder's face and name in an "About" section
- Show a Northern Cyprus phone number, not an international one
- Use Turkish throughout (not English + Turkish mix)
- Mention Kuzey Kıbrıs specifically — not generic "Cyprus"

### 13.5 CTA Design

**Primary CTA:** "Ücretsiz Deneyin" (Try It Free) → leads to onboarding form
**Secondary CTA:** WhatsApp button → direct message to SestaKibris team

The irony of using a WhatsApp button is intentional. Meet merchants where they are. Earn the right to move them.

---

## 14. SYSTEM FAILURE RISKS

### 14.1 Operational Failures

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase Realtime drops subscription | Medium | High — merchants miss orders | Implement heartbeat check + visible connection status indicator |
| Order notification not received by merchant | Medium | High — order timeout | Push notification + in-app badge; fallback SMS in Phase 2 |
| Database write fails mid-order | Low | Critical | Idempotency keys on order creation; transaction wrapping |
| Auth token expires during active session | Medium | Medium — merchant locked out mid-operation | Silent token refresh; graceful re-auth flow |
| System downtime during peak hours | Low | Critical | Supabase's managed uptime SLA; status page; merchant fallback to phone |

### 14.2 Merchant Behavior Risks

| Risk | Description | Mitigation |
|---|---|---|
| Merchant ignores orders | Stops using app but leaves catalog live | Inactivity detection; auto-close store after X unanswered orders |
| Merchant adds incorrect prices | Prices don't match physical store | Order snapshot protects customer; merchant training |
| Merchant rejects orders without reason | Customers left confused | Rejection requires reason selection; rejection rate tracked |
| Merchant marks orders as delivered when not | Gaming the system | Customer delivery confirmation in Phase 2; admin anomaly detection |
| Merchant abandons platform without notice | Customer places order at defunct store | Admin review of low-activity merchants; auto-close mechanism |

### 14.3 Courier Issues

| Risk | Description | Mitigation |
|---|---|---|
| Courier doesn't pick up their phone | No way to reach courier in transit | Merchant must have backup courier |
| Courier marks delivered before arriving | Gaming delivery confirmation | Customer confirmation step in Phase 2; GPS validation in Phase 3 |
| Courier loses order details offline | App loses internet connection | Cache active delivery details on courier's device for offline view |
| Courier resigns, merchant has no backup | Single courier dependency | Warn merchant when they have only 1 active courier |

### 14.4 Scaling Problems

| Risk | Description | Mitigation |
|---|---|---|
| Supabase Realtime connection limit | Too many concurrent subscribers | Monitor connection count; evaluate dedicated Realtime server at 500+ merchants |
| RLS query performance degradation | Too many rows, RLS policies slow queries | Add merchant_id indexes on all foreign-keyed tables; monitor query times |
| Image storage costs | Thousands of product images | Implement image size limits; compression on upload; CDN caching |
| Admin dashboard becomes slow | Too many orders to display | Pagination from day 1; never load all orders; date-range filtering mandatory |

### 14.5 UX Failures

| Risk | Description | Mitigation |
|---|---|---|
| Merchant can't find the order acceptance button | Poor mobile layout | Test with real merchants before launch; button must be full-width at bottom |
| Customer places order to wrong merchant | Multiple merchants in same category | Merchant name always visible in cart and confirmation |
| Customer doesn't know what to do after ordering | No status update | Immediate order confirmation screen; status page is next stop |
| Merchant overwhelmed by first-time UI | Too many features shown at once | Progressive disclosure; onboarding checklist; hide advanced features initially |
| Language issues | Turkish-speaking users see English errors | All error messages must be in Turkish; no raw error codes shown to users |

---

## 15. SCALE STRATEGY

### 15.1 1 Merchant: The Validation Stage

**What this looks like:**
- One grocery market in one neighborhood
- 5–30 orders per day
- 2–3 couriers
- 50–200 active customers

**What must work perfectly:**
- Order creation to delivery, end to end, with zero manual intervention
- Real-time order notifications to merchant
- Courier assignment and delivery confirmation
- Basic order history for merchant

**What can be rough:**
- Admin panel UX
- Analytics
- Onboarding flow for new merchants (admin does this manually)

**Success metric:** The merchant stops using WhatsApp for orders within 2 weeks.

### 15.2 10 Merchants: The Product-Market Fit Stage

**New challenges:**
- Merchants in different categories (grocery + water + gas) with different operational rhythms
- Admin needs to manage onboarding without manual setup of every product
- Platform must not break when one merchant has a surge

**What must not change:**
- Data isolation between merchants (RLS holds)
- Real-time order flow
- Mobile-first UX for couriers

**What evolves:**
- Self-service merchant onboarding (catalog import via CSV)
- Admin dashboard gains cross-merchant visibility
- Basic analytics per merchant

**Infrastructure check:**
- Supabase Realtime should be monitored for connection count
- Query performance reviewed against production data
- Begin SMS notification fallback integration

### 15.3 100 Merchants: The Early Scale Stage

**New challenges:**
- Support volume increases
- Merchants with very different technical comfort levels
- First signs of platform courier demand (merchants who want but can't afford their own couriers)

**What must not change:**
- Order state machine logic (do not break existing transitions)
- RLS data isolation
- Core mobile UX patterns (merchants have trained themselves; don't confuse them)

**What evolves:**
- Merchant subscription billing (Phase 2)
- Courier performance tracking begins
- Customer loyalty features (order history, saved addresses refined)
- Multi-language support audit

**Infrastructure check:**
- Consider Supabase Pro or Team plan
- Add read replica for analytics queries
- Implement database partitioning on `orders` table by `created_at`
- Customer support tooling (Intercom or equivalent)

### 15.4 1000 Merchants: The Platform Stage

**New challenges:**
- Platform couriers viable and needed
- Payment processing demand from merchants
- Enterprise merchants (larger grocery chains)
- Competitive threats from regional players

**What must not change:**
- The core promise: a merchant can receive and fulfill orders reliably
- Data isolation integrity
- Mobile-first operations

**What evolves:**
- Stripe Connect payment processing
- Platform courier network with zone-based dispatch
- API access for enterprise merchant integrations
- White-label potential for other markets
- Dedicated infrastructure review (consider self-hosted Postgres for largest merchants)

### 15.5 The One Rule That Never Changes

At every scale, from 1 to 1000 merchants:

> **A merchant must be able to receive a new order and know exactly what to do next, within 10 seconds of it arriving, on a phone with a bad internet connection.**

Every architectural decision, every feature, every hire must be evaluated against this rule. If a feature makes this harder, it doesn't ship.

---

## APPENDIX A: GLOSSARY

| Term | Definition |
|---|---|
| **Merchant** | A business owner selling groceries, water, or gas via the platform |
| **Courier** | A delivery person assigned to and managed by a merchant |
| **Platform Courier** | A future courier type registered directly with SestaKibris (Phase 3+) |
| **Order Snapshot** | The practice of copying address and price data into the order record at creation time |
| **RLS** | Row Level Security — Postgres feature enforcing data access rules at the database layer |
| **COD** | Cash on Delivery — the payment method used in Phase 1 |
| **PWA** | Progressive Web App — a mobile web application installable from the browser |
| **State Machine** | The defined set of order states and their valid transitions |
| **Realtime Subscription** | A live data connection that pushes database changes to clients instantly |
| **Edge Function** | A serverless function running close to the user, hosted by Supabase |
| **Multi-Tenancy** | The architecture pattern where multiple merchants share one platform and database |
| **Actor** | One of the four user types: Customer, Merchant, Courier, Admin |

---

## APPENDIX B: DECISION LOG

All future architectural decisions that deviate from this document must be logged here.

| Date | Decision | Rationale | Approved By |
|---|---|---|---|
| — | This document created | Initial system design | Founding Team |

---

## APPENDIX C: WHAT WE WILL NOT BUILD (Anti-Roadmap)

This list exists to prevent scope creep. These items are explicitly out of scope until circumstances change and a deliberate decision is made to add them.

- Restaurant / food preparation orders
- Scheduled future delivery (e.g., "deliver tomorrow at 9am")
- In-app chat between customer and merchant
- Customer reviews of products
- Customer referral system
- Multiple merchant storefronts in a single cart (marketplace checkout)
- Third-party seller marketplace
- Inventory forecasting
- Demand prediction AI
- Live GPS tracking of courier
- Automated pricing
- Cross-border delivery
- English-language customer interface (Phase 1)

---

*End of SestaKibris System Bible — Version 1.0*

*This document is the single source of truth. All product, engineering, and business decisions are measured against the principles and constraints defined here.*

*Last updated: May 2026*
