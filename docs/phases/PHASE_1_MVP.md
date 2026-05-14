# PHASE 1 — MVP OPERATIONAL SYSTEM

## Minimum Viable Product

---

## 1. GOAL

**One real merchant receives and fulfills real orders end-to-end, replacing their WhatsApp workflow.**

Phase 1 success means: a merchant stops using WhatsApp for orders within 2 weeks of launch.

---

## 2. SUCCESS CRITERIA

| Metric | Target |
|---|---|
| Active merchants | 3+ |
| Orders per week per merchant | 10+ |
| Successful delivery rate | > 85% |
| Customer return rate (30 day) | > 40% |
| Critical system failures | 0 |
| Merchant WhatsApp dependency | Eliminated for order flow |

---

## 3. WHAT IS BUILT

### Customer App

- Merchant storefront (browse products by merchant slug)
- Product catalog display (name, price, unit, image, availability)
- Shopping cart (add, remove, quantity adjustment)
- Order placement (address selection, notes, submit)
- Order tracking (real-time status updates)
- Customer registration and login
- Address management (add, edit, delete, set default)
- Order history (list of past orders)

### Merchant Dashboard

- Order queue with real-time updates (new orders appear instantly)
- Order actions: accept, reject (with reason), mark ready
- Courier assignment (select courier, assign to order)
- Product catalog management (add, edit, toggle availability)
- Courier roster management (add, activate/deactivate)
- Store open/close toggle
- Basic order history view

### Courier App

- Delivery queue (assigned orders)
- Order detail (address, items, customer contact)
- Navigation link (open address in device maps)
- Pickup confirmation button
- Delivery confirmation button
- Failed delivery with reason selection
- Delivery history (last 7 days)

### Admin Panel

- Merchant onboarding (create merchant + owner account)
- Merchant list (active/inactive, basic info)
- Order oversight (view all orders, filter by status/merchant)
- Order override (cancel stuck orders)
- Basic system health view (active orders, pending timeouts)

### Backend

- All database tables and RLS policies
- Order creation Edge Function (with validation, calculation, snapshots)
- Order state transition Edge Function (with state machine enforcement)
- Auth middleware (role-based route protection)
- Timeout checking (cron function for stuck orders)
- Supabase Realtime for operational screens

### PWA

- Service worker for installability
- Manifest file for home screen installation
- Offline fallback page
- Web Push notification support (permission + delivery)

---

## 4. WHAT IS NOT BUILT

| Feature | Why Not Phase 1 |
|---|---|
| Digital payments | COD is dominant; trust must be built first |
| Platform couriers | Merchants have their own; data needed for algorithms |
| Analytics dashboard | Operational flow must work first |
| Scheduled delivery | Adds complexity; merchants handle on-demand |
| Multi-language | Turkish only initially; audience is local |
| Customer reviews | No value until order volume exists |
| In-app chat | WhatsApp exists for this; focus on order flow |
| Self-service merchant signup | Admin-controlled quality in Phase 1 |
| SMS notifications | Web Push is sufficient for Phase 1 |
| Inventory auto-decrement | Manual stock management in Phase 1 |
| Search functionality | Catalogs are small; browse is sufficient |
| Customer order cancellation | Must contact merchant (simpler to implement) |
| Promotional features | No value at small scale |
| CSV product import | Manual entry is fine for 10-50 products |

---

## 5. OPERATIONAL MODEL

### Payment

- Cash on Delivery (COD) only
- Courier collects cash from customer
- Merchant settles with courier independently
- `total_amount` field is reference for collection amount

### Delivery

- Merchant-owned couriers only
- Merchant manually assigns couriers
- No dispatch algorithm
- No route optimization
- Courier navigates using device maps

### Merchant Onboarding

- Admin creates merchant account manually
- Admin enters products (or assists merchant)
- Admin verifies merchant is ready
- Admin activates merchant for customers

---

## 6. TECHNICAL SCOPE

### Pages to Build

| Route | Actor | Priority |
|---|---|---|
| `/` | Public | Landing page |
| `/[slug]` | Customer | Merchant storefront |
| `/[slug]/cart` | Customer | Shopping cart |
| `/[slug]/checkout` | Customer | Order placement |
| `/customer/orders` | Customer | Order history |
| `/customer/orders/[id]` | Customer | Order tracking |
| `/customer/profile` | Customer | Profile management |
| `/customer/addresses` | Customer | Address management |
| `/auth/login` | All | Login page |
| `/auth/register` | Customer | Registration |
| `/merchant` | Merchant | Dashboard (order queue) |
| `/merchant/orders/[id]` | Merchant | Order detail |
| `/merchant/catalog` | Merchant | Product management |
| `/merchant/catalog/new` | Merchant | Add product |
| `/merchant/catalog/[id]` | Merchant | Edit product |
| `/merchant/couriers` | Merchant | Courier roster |
| `/merchant/settings` | Merchant | Store settings |
| `/courier` | Courier | Delivery queue |
| `/courier/deliveries/[id]` | Courier | Delivery detail |
| `/courier/history` | Courier | Past deliveries |
| `/admin` | Admin | Dashboard |
| `/admin/merchants` | Admin | Merchant list |
| `/admin/merchants/new` | Admin | Onboard merchant |
| `/admin/orders` | Admin | All orders |

### Edge Functions to Build

| Function | Purpose |
|---|---|
| `create-order` | Order creation with validation |
| `transition-order-status` | State machine enforcement |
| `manage-product` | Product CRUD for merchants |
| `manage-courier` | Courier account creation |
| `onboard-merchant` | Merchant + owner account creation |
| `toggle-store-status` | Open/close store |
| `check-timeouts` | Cron: flag overdue orders |

---

## 7. ESTIMATED TIMELINE

| Component | Effort |
|---|---|
| Customer storefront + cart + checkout | 1 week |
| Customer order tracking + history | 3 days |
| Merchant order queue + actions | 1 week |
| Merchant catalog management | 4 days |
| Merchant courier management | 2 days |
| Courier app | 3 days |
| Admin panel | 4 days |
| Edge Functions (all) | 1 week |
| Realtime integration | 3 days |
| PWA + notifications | 3 days |
| Auth flows + middleware | 3 days |
| Testing + QA | 1 week |
| **Total** | **~6-8 weeks** |

---

## 8. LAUNCH CHECKLIST

- [ ] All critical paths tested with real devices
- [ ] First merchant onboarded and trained
- [ ] Products entered in catalog
- [ ] Couriers created and logged in
- [ ] Test orders placed and completed end-to-end
- [ ] Push notifications working on merchant + courier devices
- [ ] Error states handled gracefully (no raw errors shown)
- [ ] All text in Turkish
- [ ] PWA installable on Android + iOS
- [ ] Monitoring in place (order timeouts, errors)
