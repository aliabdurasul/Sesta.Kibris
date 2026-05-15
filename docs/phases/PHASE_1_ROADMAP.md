# SESTAKIBRIS — Phase 1 Engineering Execution Roadmap

> Source of truth: /docs only. API contract rule: every endpoint called must exist in API_CONTRACTS.md.


---

## 1. DOMAIN BREAKDOWN

| Domain | Purpose | Priority | Risk | Dependencies |
|---|---|---|---|---|
| Auth Flows | Login, register, session helpers for all actors | 1 | Medium | Phase 0 |
| Public Storefront | Anonymous merchant/catalog browsing at /[slug] | 2 | Low | Auth (optional), DB |
| Cart + Checkout | Cart state (zustand/sessionStorage), checkout form, order submission | 3 | Medium | Auth, Storefront |
| Order Engine | create-order + transition-order-status Edge Functions | 4 | **High** | DB, RLS |
| Merchant Operations | Order queue, actions, catalog CRUD, courier management, store toggle | 5 | High | Order Engine, Realtime |
| Courier Operations | Delivery queue, pickup/delivery/failure confirmation | 6 | Medium | Order Engine, Realtime |
| Customer Tracking | Live order status, order history, address management | 7 | Low | Order Engine, Realtime |
| Admin Panel | Merchant onboarding, order oversight, emergency cancel | 8 | Low | All Edge Functions |
| Realtime | Subscriptions for merchant queue, customer tracking, courier queue | parallel | Medium | Each operational domain |
| PWA + Cron | Installability, offline fallback, check-timeouts cron | 9 | Low | All pages complete |

### Domain Detail

**Auth Flows** — Risk: Medium. Customer self-registration is new; merchant/courier onboarding via admin requires Edge Functions. Role-based redirect logic must be tight.

**Order Engine** — Risk: High. Server-side total calculation, product snapshotting, state machine validation. All order mutations go through Edge Functions — NO direct DB writes from client for orders. This is the security and consistency backbone of Phase 1.

**Realtime** — Risk: Medium. Subscription lifecycle (subscribe on mount, unsubscribe on unmount) must be enforced everywhere. Reconnect handling requires refetch on reconnect.

---

## 2. PHASE 1 IMPLEMENTATION STAGES

### Stage 1A — Auth Flows (Tasks 23–28)
- **Goal**: All actors can log in. Customer can register. Sessions work. Role-based redirects enforced.
- **Prerequisites**: Phase 0 complete
- **Forbidden**: Merchant self-signup, social auth, magic link/OTP
- **Success**: Customer registers → /customer/orders. Merchant logs in → /merchant. Courier logs in → /courier.

### Stage 1B — Public Storefront (Tasks 29–34)
- **Goal**: Any visitor browses merchant catalog at /[slug] without auth
- **Prerequisites**: Stage 1A
- **Forbidden**: Cart submission without auth, price displayed as final server-confirmed total
- **Success**: /ahmet-bey-market renders server-side with merchant name, open/closed status, available products

### Stage 1C — Cart + Checkout (Tasks 35–37)
- **Goal**: Authenticated customer adds products, fills checkout form, submits order
- **Prerequisites**: Stage 1B, Stage 1D (create-order function deployed)
- **Forbidden**: Order total calculation on client, direct orders INSERT from client, address hardcoded
- **Success**: Order created, cart cleared, redirected to /customer/orders/[id]

### Stage 1D — Order Engine (Tasks 38–40)
- **Goal**: create-order and transition-order-status Edge Functions deployed and tested
- **Prerequisites**: All migrations applied (Phase 0B/0C)
- **Forbidden**: Any debug endpoints, any endpoints not in API_CONTRACTS.md
- **Success**: create-order returns 201 with server-calculated total. transition-order-status enforces full state machine.

### Stage 1E — Merchant Operations (Tasks 41–50)
- **Goal**: Merchant dashboard live — realtime queue, all order actions, catalog CRUD, courier management, store toggle
- **Prerequisites**: Stages 1A + 1D
- **Forbidden**: Business logic in React components, order total recalculation on merchant side
- **Success**: New order appears in merchant queue within 2s. Merchant can process order to ASSIGNED state.

### Stage 1F — Courier Operations (Tasks 51–56)
- **Goal**: Courier sees assigned deliveries, confirms pickup, confirms delivery or reports failure
- **Prerequisites**: Stage 1E
- **Forbidden**: Courier creating or cancelling orders, seeing other merchants' data
- **Success**: ASSIGNED→IN_TRANSIT→DELIVERED flow works end-to-end on mobile

### Stage 1G — Customer Tracking + History (Tasks 57–62)
- **Goal**: Customer sees live order status, full order history, can manage addresses
- **Prerequisites**: Stage 1D, Realtime
- **Forbidden**: setTimeout polling, fake "last updated" timestamps from client clock
- **Success**: Order status updates on tracking page without refresh

### Stage 1H — Admin Panel (Tasks 63–68)
- **Goal**: Admin can onboard merchants, view all orders, cancel stuck orders
- **Prerequisites**: Stage 1D (override-order + onboard-merchant Edge Functions)
- **Forbidden**: Admin editing merchant catalog, admin accessing customer private data beyond what RLS allows
- **Success**: Admin creates merchant end-to-end. Admin cancels PENDING order via override.

### Stage 1I — PWA + Cron + E2E Validation (Tasks 69–75)
- **Goal**: App installable on Android/iOS, offline fallback works, cron checks PENDING timeouts, full lifecycle validated
- **Prerequisites**: All stages complete
- **Forbidden**: Service worker caching API responses, push notification sending (permission only)
- **Success**: All Phase 1 completion criteria satisfied

---

## 3. MICRO-TASK BACKLOG

---

### TASK-23: Customer Login Page
- **Purpose**: Replace placeholder at /auth/login with real email+password login form
- **Files**: src/app/auth/login/page.tsx, src/app/auth/login/actions.ts
- **Dependencies**: TASK-06
- **Expected outcome**: Login works for all roles. Role-based redirect: customer→/customer/orders, merchant→/merchant, courier→/courier
- **Validation**:
  - [ ] Valid credentials → correct role redirect
  - [ ] Invalid password → "E-posta veya sifre hatali" (Turkish)
  - [ ] Already-authenticated visit does not loop
  - [ ] pnpm build passes

---

### TASK-24: Customer Registration Page
- **Purpose**: New customer sign-up at /auth/register (email + password + full_name + phone)
- **Files**: src/app/auth/register/page.tsx, src/app/auth/register/actions.ts
- **Dependencies**: TASK-23
- **Expected outcome**: Registration creates auth.users with role:customer + customers row. Session active. Redirect to /customer/orders.
- **Validation**:
  - [ ] app_metadata.role = customer (never merchant or courier)
  - [ ] customers row created server-side (trigger or Server Action)
  - [ ] Duplicate email → Turkish error
  - [ ] Password < 8 chars → validation error before submit
  - [ ] Build passes
- **Risk**: customers row must be created server-side — never trust client

---

### TASK-25: Auth Server Utilities
- **Purpose**: Shared getSession, signOut, requireRole helpers for all server components
- **Files**: src/lib/auth.ts
- **Dependencies**: TASK-06
- **Expected outcome**: Typed auth helpers used consistently across all server components
- **Validation**:
  - [ ] getSession() returns user with typed role from app_metadata
  - [ ] signOut() clears cookies and redirects to /
  - [ ] requireRole() throws redirect if role mismatch
  - [ ] No any types
  - [ ] Build passes

---

### TASK-26: Customer Profile + Address Pages
- **Purpose**: /customer/profile and /customer/addresses — view profile, manage delivery addresses
- **Files**: src/app/customer/profile/page.tsx, src/app/customer/addresses/page.tsx, src/app/customer/addresses/actions.ts
- **Dependencies**: TASK-25
- **Expected outcome**: Customer can add, edit, delete, set-default address
- **Validation**:
  - [ ] Only own addresses visible (RLS enforced)
  - [ ] Only one default address per customer (unique partial index enforced)
  - [ ] Server Action for all mutations (no direct client DB writes)
  - [ ] Build passes

---

### TASK-27: Merchant Auth Layout
- **Purpose**: /merchant/layout.tsx — verifies merchant role, provides merchantId to child pages
- **Files**: src/app/merchant/layout.tsx
- **Dependencies**: TASK-25
- **Expected outcome**: All /merchant/* pages receive merchantId without repeating auth checks
- **Validation**:
  - [ ] Non-merchant role redirected to correct dashboard
  - [ ] merchantId extracted from JWT app_metadata (never from DB query in layout)
  - [ ] Build passes

---

### TASK-28: Courier Auth Layout
- **Purpose**: /courier/layout.tsx — verifies courier role, provides courierId + merchantId to child pages
- **Files**: src/app/courier/layout.tsx
- **Dependencies**: TASK-25
- **Expected outcome**: All /courier/* pages receive courierId and merchantId
- **Validation**:
  - [ ] Non-courier role redirected correctly
  - [ ] courierId and merchantId from JWT app_metadata
  - [ ] Build passes

---

### TASK-29: Public Landing Page
- **Purpose**: / lists active merchants by category
- **Files**: src/app/page.tsx
- **Dependencies**: TASK-25
- **Expected outcome**: Server-rendered list of is_active merchants. No auth required.
- **Validation**:
  - [ ] Only is_active=true merchants shown
  - [ ] Links to /[slug] work
  - [ ] Page renders without auth
  - [ ] Build passes

---

### TASK-30: Merchant Storefront Page
- **Purpose**: /[slug] — public product catalog for a specific merchant
- **Files**: src/app/[slug]/page.tsx, src/app/[slug]/layout.tsx
- **Dependencies**: TASK-29
- **Expected outcome**: Server-renders merchant info, is_open status, all available products
- **Validation**:
  - [ ] 404 if slug not found or is_active=false
  - [ ] Only is_available=true products shown
  - [ ] Prices shown in TL format (kurus /100)
  - [ ] Works without auth
  - [ ] [slug] does not conflict with /merchant, /courier, /admin, /customer, /auth routes
  - [ ] Build passes
- **Risk**: Next.js route precedence — add static route exclusions to [slug]/layout

---

### TASK-31: ProductCard Component
- **Purpose**: Reusable product card — name, price, unit, add-to-cart button
- **Files**: src/components/ui/ProductCard.tsx
- **Dependencies**: TASK-30
- **Expected outcome**: Renders product data, emits onAddToCart callback, disabled when unavailable
- **Validation**:
  - [ ] Tailwind only, no inline styles
  - [ ] Disabled state when is_available=false
  - [ ] Price format: "150,00 TL" (Turkish locale)
  - [ ] Touch target >= 44px height
  - [ ] Named export
  - [ ] Build passes

---

### TASK-32: Cart State (Zustand)
- **Purpose**: Client-side cart persisted to sessionStorage (NOT localStorage)
- **Files**: src/hooks/useCart.ts
- **Dependencies**: TASK-31
- **Expected outcome**: Cart survives page refresh within tab session. Cleared on order completion.
- **Validation**:
  - [ ] addItem, removeItem, updateQuantity, clearCart all work
  - [ ] Cart is merchant-scoped — adding from different merchant clears existing cart
  - [ ] sessionStorage persistence (NOT localStorage)
  - [ ] Display total is for UI only — never sent as final amount to Edge Function
  - [ ] No redux, no jotai, zustand only

---

### TASK-33: Cart Page
- **Purpose**: /[slug]/cart — shows cart items, display-only total, proceed to checkout
- **Files**: src/app/[slug]/cart/page.tsx
- **Dependencies**: TASK-32
- **Expected outcome**: Cart renders with item list. Empty state. Unauthenticated users prompted to log in.
- **Validation**:
  - [ ] Empty cart → "Sepetiniz bos" with back-to-store link
  - [ ] Display total labeled as estimate (not confirmed)
  - [ ] Unauthenticated → "Devam etmek icin giris yapin" with return redirect
  - [ ] Build passes

---

### TASK-34: Checkout Page + Form
- **Purpose**: /[slug]/checkout — address selection, notes, order submission
- **Files**: src/app/[slug]/checkout/page.tsx, src/app/[slug]/checkout/actions.ts
- **Dependencies**: TASK-33, TASK-26, TASK-38 (create-order deployed)
- **Expected outcome**: Server Action calls create-order Edge Function. On success: cart cleared, redirect to /customer/orders/[id].
- **Validation**:
  - [ ] Order submitted via Server Action ONLY — no direct client fetch to Edge Function
  - [ ] address_id validated server-side (belongs to session user)
  - [ ] Loading state during submission
  - [ ] On error: Turkish error message, cart preserved
  - [ ] Merchant closed → "Bu magaza simdi kapali"
  - [ ] Build passes

---

### TASK-35: Edge Function Shared Utilities
- **Purpose**: Shared auth validation, error response format, CORS headers for all Edge Functions
- **Files**: supabase/functions/_shared/auth.ts, supabase/functions/_shared/errors.ts, supabase/functions/_shared/cors.ts
- **Dependencies**: Phase 0 migrations complete
- **Expected outcome**: All Edge Functions use these utilities — no duplicated auth/error code
- **Validation**:
  - [ ] verifyJWT(req) extracts JWT, returns typed user with role from app_metadata
  - [ ] requireRole(user, allowedRoles) throws AUTH_FORBIDDEN if not in list
  - [ ] errorResponse(code, message, status) returns shape per API_CONTRACTS.md section 6
  - [ ] CORS configured for Supabase Edge environment
  - [ ] No any types

---

### TASK-36: create-order Edge Function
- **Purpose**: supabase/functions/create-order/index.ts — server-side order creation with validation
- **Files**: supabase/functions/create-order/index.ts
- **Dependencies**: TASK-35
- **Expected outcome**: POST creates validated order. Server calculates total. Snapshots address + products.
- **Validation**:
  - [ ] Validates merchant exists and is_open=true
  - [ ] Validates all products belong to merchant and is_available=true
  - [ ] Fetches current prices from DB — client-provided prices IGNORED
  - [ ] Calculates line_total = unit_price * quantity per item
  - [ ] Calculates total_amount = sum of line_totals
  - [ ] Snapshots delivery_address JSONB from customer_addresses
  - [ ] Snapshots product_name + unit_price into order_items
  - [ ] Inserts order with status PENDING
  - [ ] Inserts all order_items
  - [ ] Inserts order_status_log (from_status=NULL, to_status=PENDING)
  - [ ] Returns 201 { order: { id, status, total_amount, created_at } }
  - [ ] Returns documented error codes per API_CONTRACTS.md section 2.1
  - [ ] Empty cart → 400 VALIDATION_FAILED
  - [ ] Service role key never returned in response body
- **Risk**: All operations must be atomic — use a single DB transaction

---

### TASK-37: transition-order-status Edge Function
- **Purpose**: supabase/functions/transition-order-status/index.ts — all order state changes
- **Files**: supabase/functions/transition-order-status/index.ts
- **Dependencies**: TASK-35
- **Expected outcome**: POST validates actor, validates transition, executes atomically with status log
- **Validation**:
  - [ ] Fetches current order state from DB (never trusts client current_status)
  - [ ] Validates transition against ORDER_STATE_MACHINE.md section 2 matrix
  - [ ] Validates actor role against permitted actors per state
  - [ ] Validates required fields: rejection_reason (REJECTED), failure_reason (FAILED_DELIVERY), courier_id (ASSIGNED)
  - [ ] INSERTs order_status_log BEFORE updating orders (state machine rule 1)
  - [ ] UPDATEs orders.status + relevant timestamp atomically
  - [ ] Returns 200 { order: { id, status, accepted_at/delivered_at/etc } }
  - [ ] ORDER_INVALID_TRANSITION (400) for invalid transitions
  - [ ] ORDER_TERMINAL_STATE (409) for DELIVERED/REJECTED/CANCELLED
  - [ ] AUTH_FORBIDDEN (403) for wrong-role actors
  - [ ] ASSIGNED→READY (unassign) clears courier_id and assigned_at
  - [ ] All error codes match API_CONTRACTS.md section 6

---

### TASK-38: Merchant Dashboard Shell + Layout
- **Purpose**: /merchant/layout.tsx — persistent shell with nav, connection status indicator
- **Files**: src/app/merchant/layout.tsx, src/components/ui/ConnectionStatus.tsx
- **Dependencies**: TASK-27
- **Expected outcome**: Persistent bottom nav. Live connection status dot (green/yellow/red).
- **Validation**:
  - [ ] Green/yellow/red dot per REALTIME_STRATEGY.md section 4
  - [ ] Connection status driven by actual subscription state
  - [ ] Nav links: Siparisler / Katalog / Kuryeler / Ayarlar
  - [ ] Bottom nav on mobile (<= 640px), side nav on desktop
  - [ ] Build passes

---

### TASK-39: Merchant Order Queue (Realtime)
- **Purpose**: /merchant — live order queue with postgres_changes subscription
- **Files**: src/app/merchant/page.tsx, src/hooks/useOrderSubscription.ts
- **Dependencies**: TASK-38, TASK-37
- **Expected outcome**: New orders appear without page refresh. Grouped by PENDING / CONFIRMED / READY.
- **Validation**:
  - [ ] Uses postgres_changes channel (NOT broadcast)
  - [ ] Subscription filter: merchant_id=eq.{merchantId} at DB level
  - [ ] Unsubscribes on unmount
  - [ ] On reconnect: refetches full order list before re-subscribing
  - [ ] "Baglantiyi kaybettiniz" indicator when subscription drops
  - [ ] Orders sorted by created_at DESC
  - [ ] Empty state: "Henuz siparis yok"
  - [ ] Build passes

---

### TASK-40: Order Accept / Reject
- **Purpose**: Merchant accepts or rejects PENDING orders from queue
- **Files**: src/app/merchant/page.tsx (buttons), src/app/merchant/actions.ts
- **Dependencies**: TASK-39
- **Expected outcome**: Accept calls transition-order-status CONFIRMED. Reject opens reason modal then REJECTED.
- **Validation**:
  - [ ] Accept only shown on PENDING orders
  - [ ] Reject requires non-empty reason text
  - [ ] Buttons disabled during in-flight request (no double-submit)
  - [ ] Error shown in Turkish if transition fails
  - [ ] Build passes

---

### TASK-41: Order Detail + Mark Ready + Courier Assignment
- **Purpose**: /merchant/orders/[id] — full order detail, mark ready, assign courier
- **Files**: src/app/merchant/orders/[id]/page.tsx, src/app/merchant/orders/[id]/actions.ts
- **Dependencies**: TASK-40
- **Expected outcome**: "Hazir" transitions to READY. Courier dropdown shows active own couriers. Assign transitions to ASSIGNED.
- **Validation**:
  - [ ] Courier list: own couriers only, is_active=true, fetched from DB
  - [ ] Assign requires courier_id selection
  - [ ] courier_id validated server-side (belongs to same merchant)
  - [ ] Build passes

---

### TASK-42: manage-product Edge Function
- **Purpose**: supabase/functions/manage-product/index.ts — merchant product CRUD
- **Files**: supabase/functions/manage-product/index.ts
- **Dependencies**: TASK-35
- **Expected outcome**: POST creates product. PUT updates. merchant_id always from JWT, never from body.
- **Validation**:
  - [ ] POST: merchant_id set from JWT app_metadata.merchant_id
  - [ ] PUT: validates product.merchant_id == JWT merchant_id before updating
  - [ ] Price must be integer > 0 (kurus)
  - [ ] Returns 403 if product belongs to different merchant
  - [ ] No phantom request fields beyond API_CONTRACTS.md section 3.1

---

### TASK-43: Merchant Catalog Pages
- **Purpose**: /merchant/catalog — list, add, edit products
- **Files**: src/app/merchant/catalog/page.tsx, src/app/merchant/catalog/new/page.tsx, src/app/merchant/catalog/[id]/page.tsx
- **Dependencies**: TASK-42
- **Expected outcome**: Full catalog CRUD. Inline availability toggle. Price input in TL (converted to kurus server-side).
- **Validation**:
  - [ ] Product list includes unavailable products (merchant sees all)
  - [ ] Availability toggle calls manage-product PUT immediately
  - [ ] Price input validation: > 0, numeric
  - [ ] Edit form pre-populates with current product values
  - [ ] Build passes

---

### TASK-43B: manage-courier Edge Function
- **Purpose**: supabase/functions/manage-courier/index.ts — merchant creates/updates courier accounts
- **Files**: supabase/functions/manage-courier/index.ts
- **Dependencies**: TASK-35
- **Expected outcome**: POST creates auth.users with role:courier + merchant_id + courier_id in app_metadata. Creates couriers row.
- **Validation**:
  - [ ] Auth account created with correct app_metadata per AUTH_AND_ROLES.md section 2
  - [ ] couriers row linked to calling merchant_id from JWT
  - [ ] Duplicate email → 400 (not 500)
  - [ ] Only merchant role can call
  - [ ] No password in response
  - [ ] Service role key used server-side only

---

### TASK-44: Merchant Courier Management Page
- **Purpose**: /merchant/couriers — list couriers, add couriers, activate/deactivate
- **Files**: src/app/merchant/couriers/page.tsx
- **Dependencies**: TASK-43B
- **Expected outcome**: Courier roster with add form and active/inactive toggle
- **Validation**:
  - [ ] Only own couriers visible (RLS enforced)
  - [ ] Add courier calls manage-courier Edge Function via Server Action
  - [ ] Toggle active calls manage-courier PUT
  - [ ] Build passes

---

### TASK-45: toggle-store-status Edge Function
- **Purpose**: supabase/functions/toggle-store-status/index.ts — merchant opens/closes store
- **Files**: supabase/functions/toggle-store-status/index.ts
- **Dependencies**: TASK-35
- **Expected outcome**: POST with { is_open: boolean } updates merchants.is_open for calling merchant
- **Validation**:
  - [ ] merchant_id always from JWT (never from body)
  - [ ] Only merchant role can call
  - [ ] Returns { id, is_open }
  - [ ] create-order function respects is_open=false → MERCHANT_CLOSED error

---

### TASK-46: Merchant Settings Page
- **Purpose**: /merchant/settings — store open/close toggle, store info display
- **Files**: src/app/merchant/settings/page.tsx, src/app/merchant/settings/actions.ts
- **Dependencies**: TASK-45
- **Expected outcome**: Big toggle switch. "Magaza acik / Magaza kapali". State fetched from DB on load.
- **Validation**:
  - [ ] Toggle calls Server Action → toggle-store-status Edge Function
  - [ ] State reflects DB value on load (not optimistic without confirmation)
  - [ ] Build passes

---

### TASK-47: Courier Delivery Queue (Realtime)
- **Purpose**: /courier — assigned deliveries with postgres_changes subscription
- **Files**: src/app/courier/page.tsx, src/hooks/useCourierSubscription.ts
- **Dependencies**: TASK-28, TASK-37
- **Expected outcome**: ASSIGNED and IN_TRANSIT orders shown in real-time. Mobile-optimized list.
- **Validation**:
  - [ ] Subscription filter: courier_id=eq.{courierId} (own orders only)
  - [ ] Shows ASSIGNED and IN_TRANSIT status orders only
  - [ ] Unsubscribes on unmount
  - [ ] Connection status indicator
  - [ ] Empty state: "Atanmis teslimat yok"
  - [ ] Build passes

---

### TASK-48: Courier Delivery Detail Page
- **Purpose**: /courier/deliveries/[id] — order detail with pickup/delivery/failure actions
- **Files**: src/app/courier/deliveries/[id]/page.tsx, src/app/courier/deliveries/[id]/actions.ts
- **Dependencies**: TASK-47
- **Expected outcome**: Address, items, contact info. Pickup button (ASSIGNED→IN_TRANSIT). Delivery button (IN_TRANSIT→DELIVERED). Failure button with required reason.
- **Validation**:
  - [ ] "Haritada Ac" link: geo:{lat,lng} scheme on mobile
  - [ ] Pickup button only on ASSIGNED orders
  - [ ] Delivery button only on IN_TRANSIT orders
  - [ ] Failure requires reason from predefined list (not free text)
  - [ ] All transitions via transition-order-status Edge Function through Server Action
  - [ ] Build passes

---

### TASK-49: Courier Delivery History
- **Purpose**: /courier/history — past 7 days DELIVERED/FAILED_DELIVERY orders
- **Files**: src/app/courier/history/page.tsx
- **Dependencies**: TASK-47
- **Expected outcome**: Server-rendered history. No realtime needed.
- **Validation**:
  - [ ] Filtered by courier_id (RLS + explicit query filter)
  - [ ] Date range: last 7 days
  - [ ] Empty state: "Teslimat gecmisi bulunamadi"
  - [ ] Build passes

---

### TASK-50: Customer Order Tracking (Realtime)
- **Purpose**: /customer/orders/[id] — live status timeline for active order
- **Files**: src/app/customer/orders/[id]/page.tsx, src/hooks/useOrderTracking.ts
- **Dependencies**: TASK-34, TASK-37
- **Expected outcome**: Real-time status updates without refresh. Turkish status labels. Disconnection fallback.
- **Validation**:
  - [ ] Subscription filter: id=eq.{orderId} (single row subscription)
  - [ ] Status timeline from order_status_log table
  - [ ] Turkish labels: PENDING=Onay bekleniyor, CONFIRMED=Hazirlaniyor, READY=Hazir, ASSIGNED=Kurye atandi, IN_TRANSIT=Yolda, DELIVERED=Teslim edildi, REJECTED=Reddedildi, CANCELLED=Iptal edildi
  - [ ] "Son guncelleme: X dakika once" if disconnected (REALTIME_STRATEGY.md section 4)
  - [ ] Unsubscribes on terminal states (DELIVERED/REJECTED/CANCELLED)
  - [ ] Build passes

---

### TASK-51: Customer Order History
- **Purpose**: /customer/orders — list of all past and active orders
- **Files**: src/app/customer/orders/page.tsx
- **Dependencies**: TASK-50
- **Expected outcome**: Server-rendered list. Active orders show live status. Links to tracking page.
- **Validation**:
  - [ ] Only own orders (RLS enforced)
  - [ ] Sorted by created_at DESC
  - [ ] Active orders show current status
  - [ ] Empty state: "Henuz siparis vermediniz"
  - [ ] Build passes

---

### TASK-52: onboard-merchant Edge Function
- **Purpose**: supabase/functions/onboard-merchant/index.ts — admin creates merchant + owner account
- **Files**: supabase/functions/onboard-merchant/index.ts
- **Dependencies**: TASK-35
- **Expected outcome**: Creates auth.users with role:merchant, creates merchants row, sets merchant_id in app_metadata
- **Validation**:
  - [ ] Only admin role can call (service role key required)
  - [ ] Creates auth account with app_metadata.role=merchant
  - [ ] Creates merchants row with slug uniqueness check
  - [ ] Sets app_metadata.merchant_id on auth account after merchant row creation
  - [ ] Duplicate slug → 400 with clear error
  - [ ] All steps per API_CONTRACTS.md section 4.1

---

### TASK-53: override-order Edge Function
- **Purpose**: supabase/functions/override-order/index.ts — admin emergency order cancellation
- **Files**: supabase/functions/override-order/index.ts
- **Dependencies**: TASK-37
- **Expected outcome**: Admin can cancel any non-terminal order with a note
- **Validation**:
  - [ ] Only admin role can call
  - [ ] Can cancel PENDING/CONFIRMED/READY/FAILED_DELIVERY orders
  - [ ] Cannot modify DELIVERED/REJECTED/CANCELLED (terminal)
  - [ ] Inserts order_status_log entry with actor_role=admin
  - [ ] Returns updated order

---

### TASK-54: Admin Panel Shell
- **Purpose**: /admin/layout.tsx — admin shell with nav to Merchants / Orders
- **Files**: src/app/admin/layout.tsx
- **Dependencies**: TASK-25
- **Expected outcome**: Admin-only layout. Non-admin role redirected.
- **Validation**:
  - [ ] Non-admin role redirected to correct dashboard
  - [ ] Nav: Merchants / Orders
  - [ ] Build passes

---

### TASK-55: Admin Merchant Management
- **Purpose**: /admin/merchants (list) + /admin/merchants/new (onboard form)
- **Files**: src/app/admin/merchants/page.tsx, src/app/admin/merchants/new/page.tsx, src/app/admin/merchants/actions.ts
- **Dependencies**: TASK-52, TASK-54
- **Expected outcome**: Admin sees all merchants. Form creates new merchant via onboard-merchant Edge Function.
- **Validation**:
  - [ ] Merchant list shows name, slug, category, is_active status
  - [ ] New merchant form validates: name, slug (URL-safe), category, phone, owner_email
  - [ ] Slug uniqueness error shown in Turkish
  - [ ] Build passes

---

### TASK-56: Admin Order Oversight
- **Purpose**: /admin/orders — all orders with status filter + cancel action
- **Files**: src/app/admin/orders/page.tsx, src/app/admin/orders/actions.ts
- **Dependencies**: TASK-53, TASK-54
- **Expected outcome**: Admin sees all orders across all merchants. Can cancel non-terminal orders.
- **Validation**:
  - [ ] Filter by status works
  - [ ] Cancel action calls override-order Edge Function
  - [ ] Terminal orders have no cancel button
  - [ ] Build passes

---

### TASK-57: check-timeouts Cron Edge Function
- **Purpose**: supabase/functions/check-timeouts/index.ts — flags PENDING orders past merchant timeout
- **Files**: supabase/functions/check-timeouts/index.ts, src/app/api/cron/check-timeouts/route.ts
- **Dependencies**: TASK-35
- **Expected outcome**: Queries PENDING orders older than merchants.order_timeout_minutes. Logs to order_status_log. Returns flagged order list.
- **Validation**:
  - [ ] /api/cron/check-timeouts route validates CRON_SECRET header
  - [ ] Queries: SELECT orders WHERE status=PENDING AND created_at < now() - interval
  - [ ] Only logs warning — does NOT auto-cancel (per ORDER_STATE_MACHINE.md section 6)
  - [ ] Returns count of flagged orders
  - [ ] Vercel Cron config in vercel.json (schedule: every 5 minutes)
  - [ ] No debug endpoints created
- **Risk**: /api/cron/check-timeouts is the ONLY Next.js API route in Phase 1. Must be in API_CONTRACTS.md section 5.2 — it is.

---

### TASK-58: PWA Manifest + Service Worker
- **Purpose**: app/manifest.ts + public/sw.js — installability + offline fallback
- **Files**: src/app/manifest.ts, public/sw.js, src/app/offline/page.tsx
- **Dependencies**: All pages complete
- **Expected outcome**: App installable on Android and iOS. Offline page shown when no connection.
- **Validation**:
  - [ ] manifest.json has name, short_name, icons (192px + 512px), theme_color, display=standalone
  - [ ] Service worker registers on load
  - [ ] Offline fallback page: "Internet baglantinizi kontrol edin"
  - [ ] Service worker does NOT cache API responses or Supabase calls
  - [ ] Lighthouse PWA score >= 90
  - [ ] Build passes

---

### TASK-59: Push Notification Permission Flow
- **Purpose**: Request notification permission on merchant + courier dashboards (no sending in Phase 1)
- **Files**: src/hooks/usePushPermission.ts, src/components/ui/NotificationPrompt.tsx
- **Dependencies**: TASK-58
- **Expected outcome**: Merchant and courier are prompted to allow notifications. Permission state saved.
- **Validation**:
  - [ ] Prompt shown only once per device (not on every page load)
  - [ ] No actual push messages sent in Phase 1 (permission only)
  - [ ] Graceful if permission denied (no error thrown)
  - [ ] Build passes

---

### TASK-60: Bottom Navigation Component (Mobile-First)
- **Purpose**: Shared bottom nav for customer area on mobile
- **Files**: src/components/ui/BottomNav.tsx
- **Dependencies**: TASK-29
- **Expected outcome**: Sticky bottom nav on screens <= 640px. Links: Ana Sayfa / Siparislerim / Profil.
- **Validation**:
  - [ ] Touch targets >= 44px
  - [ ] Active state highlights current route
  - [ ] Hidden on desktop (>= 640px breakpoint)
  - [ ] Build passes

---

### TASK-61: Loading + Empty + Error State Components
- **Purpose**: Consistent loading spinners, empty states, and error messages in Turkish across all screens
- **Files**: src/components/ui/LoadingSpinner.tsx, src/components/ui/EmptyState.tsx, src/components/ui/ErrorMessage.tsx
- **Dependencies**: TASK-29
- **Expected outcome**: Every async operation has loading, empty, and error states. All error text in Turkish.
- **Validation**:
  - [ ] LoadingSpinner: accessible aria-label, Tailwind animated
  - [ ] EmptyState: accepts icon + message + optional action button
  - [ ] ErrorMessage: maps error codes to Turkish per CODING_STANDARDS.md section 5
  - [ ] No raw error codes displayed to users
  - [ ] Build passes

---

### TASK-62: Error Boundaries
- **Purpose**: error.tsx files for merchant, courier, customer, admin route groups
- **Files**: src/app/merchant/error.tsx, src/app/courier/error.tsx, src/app/customer/error.tsx, src/app/admin/error.tsx
- **Dependencies**: TASK-61
- **Expected outcome**: Unexpected errors show friendly Turkish page instead of raw crash
- **Validation**:
  - [ ] Error boundary catches render errors
  - [ ] Shows "Bir hata olustu" with retry button
  - [ ] Does not expose stack traces to users
  - [ ] Build passes

---

### TASK-63: OrderCard Component (Merchant)
- **Purpose**: Reusable order summary card for merchant queue — order ID, customer name, total, status, time elapsed, action buttons
- **Files**: src/components/ui/OrderCard.tsx
- **Dependencies**: TASK-39
- **Expected outcome**: Compact card with all relevant info for merchant to act on
- **Validation**:
  - [ ] Shows formatted total (TL)
  - [ ] Shows time since creation ("5 dakika once")
  - [ ] Status badge with Turkish label
  - [ ] Action buttons passed as children (not hardcoded in component)
  - [ ] Named export
  - [ ] Build passes

---

### TASK-64: OrderStatusBadge Component
- **Purpose**: Colored status badge with Turkish label for all 9 order states
- **Files**: src/components/ui/OrderStatusBadge.tsx
- **Dependencies**: TASK-50
- **Expected outcome**: Consistent status display across all actor dashboards
- **Validation**:
  - [ ] All 9 states have distinct colors
  - [ ] Turkish labels for all states
  - [ ] Named export
  - [ ] Build passes

---

### TASK-65: Price Formatting Utility
- **Purpose**: Consistent kurus→TL display conversion across all UIs
- **Files**: src/lib/formatPrice.ts
- **Dependencies**: TASK-31
- **Expected outcome**: formatPrice(15000) → "150,00 TL" (Turkish locale)
- **Validation**:
  - [ ] Uses Intl.NumberFormat with tr-TR locale
  - [ ] Handles edge cases: 0, 1 (0,01 TL), large numbers
  - [ ] Used in ProductCard, OrderCard, checkout — no inline math elsewhere
  - [ ] Build passes

---

### TASK-66: Date/Time Formatting Utility
- **Purpose**: Turkish date + relative time formatting
- **Files**: src/lib/formatDate.ts
- **Dependencies**: TASK-51
- **Expected outcome**: formatRelative(date) → "5 dakika once". formatDate(date) → "14 Mayis 2026, 19:30"
- **Validation**:
  - [ ] Turkish month names
  - [ ] Relative time: saniye/dakika/saat/gun
  - [ ] No external date library (no dayjs/moment) — native Intl.RelativeTimeFormat
  - [ ] Build passes

---

---

## 4. API CONTRACT COMPLIANCE MAP

**Rule**: Every Edge Function or Next.js API route called in Phase 1 must exist in docs/API_CONTRACTS.md.

| Endpoint Called | Defined In API_CONTRACTS.md | Section | Phase 1 Task |
|---|---|---|---|
| create-order | YES | 2.1 | TASK-36 |
| transition-order-status | YES | 2.2 | TASK-37 |
| manage-product (POST/PUT) | YES | 3.1 | TASK-42 |
| manage-courier (POST/PUT) | YES | 3.2 | TASK-43B |
| toggle-store-status | YES | 3.3 | TASK-45 |
| onboard-merchant | YES | 4.1 | TASK-52 |
| override-order | YES | 4.2 | TASK-53 |
| /api/cron/check-timeouts | YES | 5.2 | TASK-57 |

**NO OTHER API ROUTES OR EDGE FUNCTIONS ARE CREATED IN PHASE 1.**
**NO /api/debug/*, /api/test/*, or any undocumented endpoints.**

---

## 5. REALTIME SUBSCRIPTION MAP

Per REALTIME_STRATEGY.md section 2:

| Screen | File | Channel | Filter | Task |
|---|---|---|---|---|
| Merchant Order Queue | src/hooks/useOrderSubscription.ts | postgres_changes on orders | merchant_id=eq.{id} | TASK-39 |
| Merchant Order Detail | src/app/merchant/orders/[id]/page.tsx | postgres_changes on orders | id=eq.{orderId} | TASK-41 |
| Customer Order Tracking | src/hooks/useOrderTracking.ts | postgres_changes on orders | id=eq.{orderId} | TASK-50 |
| Courier Delivery Queue | src/hooks/useCourierSubscription.ts | postgres_changes on orders | courier_id=eq.{id} | TASK-47 |

**All subscriptions**: unsubscribe on unmount, refetch on reconnect, show connection status indicator.
**No realtime on**: product catalog, order history, customer profile, courier history — per REALTIME_STRATEGY.md section 2.

---

## 6. ROUTE MAP (All Routes in Phase 1)

Per PHASE_1_MVP.md section 6:

| Route | Actor | Auth Required | Server/Client | Task |
|---|---|---|---|---|
| / | Public | No | Server | TASK-29 |
| /[slug] | Customer | No | Server | TASK-30 |
| /[slug]/cart | Customer | No (view) / Yes (checkout) | Client | TASK-33 |
| /[slug]/checkout | Customer | Yes | Server+Action | TASK-34 |
| /auth/login | All | No | Server+Action | TASK-23 |
| /auth/register | Customer | No | Server+Action | TASK-24 |
| /customer/orders | Customer | Yes | Server | TASK-51 |
| /customer/orders/[id] | Customer | Yes | Client (realtime) | TASK-50 |
| /customer/profile | Customer | Yes | Server | TASK-26 |
| /customer/addresses | Customer | Yes | Server+Action | TASK-26 |
| /merchant | Merchant | Yes | Client (realtime) | TASK-39 |
| /merchant/orders/[id] | Merchant | Yes | Client+Action | TASK-41 |
| /merchant/catalog | Merchant | Yes | Server | TASK-43 |
| /merchant/catalog/new | Merchant | Yes | Server+Action | TASK-43 |
| /merchant/catalog/[id] | Merchant | Yes | Server+Action | TASK-43 |
| /merchant/couriers | Merchant | Yes | Server+Action | TASK-44 |
| /merchant/settings | Merchant | Yes | Server+Action | TASK-46 |
| /courier | Courier | Yes | Client (realtime) | TASK-47 |
| /courier/deliveries/[id] | Courier | Yes | Client+Action | TASK-48 |
| /courier/history | Courier | Yes | Server | TASK-49 |
| /admin | Admin | Yes | Server | TASK-54 |
| /admin/merchants | Admin | Yes | Server | TASK-55 |
| /admin/merchants/new | Admin | Yes | Server+Action | TASK-55 |
| /admin/orders | Admin | Yes | Server+Action | TASK-56 |
| /api/cron/check-timeouts | System | CRON_SECRET | Route Handler | TASK-57 |
| /offline | Public | No | Server | TASK-58 |

---

## 7. FORBIDDEN PATTERNS (Phase 1)

### API / Endpoint
- NEVER create endpoints not in API_CONTRACTS.md
- NEVER create /api/debug/*, /api/test/*, /api/health/* endpoints
- NEVER call Supabase directly from client for order mutations (INSERT/UPDATE on orders)
- NEVER use fetch() to call Supabase REST API (bypass the client library)

### Order Engine
- NEVER calculate order totals on the client and use as final amount
- NEVER INSERT into orders table from client code
- NEVER UPDATE orders.status from client code
- NEVER skip order_status_log entry on any state transition

### State + Data
- NEVER store order/merchant data in localStorage
- NEVER use optimistic UI without realtime rollback confirmation
- NEVER use setTimeout for polling instead of realtime
- NEVER use React Context for server state (orders, products)

### Realtime
- NEVER leave realtime subscriptions open after component unmount
- NEVER subscribe without a filter (except admin — platform-wide is intentional)
- NEVER open multiple subscriptions to same table with different filters on one page
- NEVER assume realtime delivers ALL events (always refetch on reconnect)

### Components
- NEVER create components > 300 lines
- NEVER put business logic in page components (delegate to hooks or server actions)
- NEVER use default exports except for page.tsx files
- NEVER use any type

### Security
- NEVER expose SUPABASE_SERVICE_ROLE_KEY in any client code
- NEVER trust client-supplied merchant_id, courier_id, or role in Edge Functions
- NEVER bypass RLS with service role in client-accessible code

---

## 8. DEPENDENCIES TO INSTALL IN PHASE 1

Install only when the task that needs them begins:

| Package | When | Task |
|---|---|---|
| zustand | Cart state | TASK-32 |
| react-hook-form | Checkout + catalog forms | TASK-34, TASK-43 |
| zod | Form + Edge Function validation | TASK-34, TASK-36 |

No other libraries. No UI component libraries. Tailwind only for all UI.

---

## 9. PHASE 1 COMPLETION CRITERIA

Phase 1 is DONE only when ALL of these are true:

1. [ ] Real customer places an order on mobile without errors
2. [ ] Merchant receives order in real-time (< 3 seconds)
3. [ ] Merchant can accept, mark ready, and assign courier
4. [ ] Courier sees assignment in real-time, confirms pickup and delivery
5. [ ] Customer sees all status transitions on tracking page without refresh
6. [ ] All state transitions persisted in DB + order_status_log
7. [ ] Page refresh at any step does NOT break state
8. [ ] supabase db reset + seed works cleanly
9. [ ] npm run build passes with 0 errors
10. [ ] npm run lint passes with 0 warnings
11. [ ] No 404 errors from any API call in production
12. [ ] No undefined endpoints called anywhere in the codebase
13. [ ] No secrets in git history
14. [ ] All text facing users is in Turkish
15. [ ] App is installable as PWA on Android Chrome
16. [ ] First merchant can be onboarded by admin end-to-end

---

## 10. TASK EXECUTION RULES

### Commit Strategy
- One commit per completed task
- Format: feat(domain): TASK-XX description
- Examples: feat(orders): TASK-36 create-order Edge Function, feat(merchant): TASK-39 realtime order queue

### Execution Order
- Tasks within a stage must complete in numeric order
- A task cannot begin until all its listed dependencies are committed
- After each task: run npm run build + npm run type-check before committing
- If build fails: fix within same task, do not move on

### Architecture Drift Prevention
- Before writing any file: re-read the relevant /docs section
- Every Edge Function call must be verified against API_CONTRACTS.md
- Every realtime subscription must be verified against REALTIME_STRATEGY.md
- If implementation would deviate from docs: docs win, adjust code

### API Contract Validation (Critical Rule)
- Before calling any endpoint: verify it exists in API_CONTRACTS.md
- Before creating any endpoint: verify it is in API_CONTRACTS.md
- If an endpoint is needed but not in docs: STOP and document it first
- Zero tolerance for phantom endpoints

---
