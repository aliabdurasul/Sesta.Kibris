# SESTAKIBRIS
### System Master Document — Version 2.0
### Status: ACTIVE — Single Source of Truth

---

## 1. SYSTEM IDENTITY

SestaKibris is a **hyperlocal commerce operating system** for Northern Cyprus (KKTC).

It connects:
- **Customers** who need groceries, water, and gas delivered
- **Merchants** who sell and fulfill those orders
- **Couriers** who move products from merchant to customer
- **Admins** who operate and scale the platform

SestaKibris replaces informal WhatsApp-based ordering with operational structure, transparency, and reliability for Turkish-speaking local markets.

---

## 2. WHAT SESTAKIBRIS IS

- A **merchant operating system** — order management, fulfillment, courier dispatch
- A **customer ordering platform** — browse, order, track
- A **courier dispatch system** — assignment, navigation, confirmation
- An **admin control center** — merchant management, system health, data

---

## 3. WHAT SESTAKIBRIS IS NOT

- A social commerce platform (no feeds, no stories)
- A national e-commerce platform (no cross-region shipping)
- A food delivery platform (no restaurant menus, no kitchen logistics)
- A general marketplace (no third-party sellers, no auctions)
- A payment processor (no direct money handling in Phase 1)
- A logistics network (couriers are merchant-owned in Phase 1)
- A WhatsApp replacement (it replaces the *need* for WhatsApp)

---

## 4. CORE PHILOSOPHY

**Simplicity is the product.**

Every decision must answer:
> "Does this make it easier for one merchant to fulfill one real order today?"

If the answer is no, the feature does not ship.

### Non-Negotiable Principles

| Principle | Rule |
|---|---|
| Real-world first | Build for how merchants actually work |
| Operational clarity | Every actor must always know what to do next |
| Minimum viable trust | Customers must trust delivery will happen before they order |
| WhatsApp-level friction | If it's harder than sending a WhatsApp message, it will be abandoned |
| No fake functionality | No mock data in production, no buttons that do nothing |

---

## 5. THE FOUR ACTORS

### 5.1 Customer

**Who**: Residents of Northern Cyprus ordering groceries, water, and gas.

**Primary motivation**: Receive reliable delivery without phone calls.

**Actions**:
- Browse merchant catalog
- Add items to cart
- Specify delivery address and notes
- Submit order
- Track order status in real time
- View order history

**Limitations**:
- Cannot modify an order after merchant acceptance
- Cannot select a specific courier
- Cannot schedule future delivery (Phase 1)
- Cannot pay digitally (Phase 1)

### 5.2 Merchant

**Who**: Owners/operators of grocery markets, water delivery services, or gas/tube sellers.

**Primary motivation**: Receive organized orders, fulfill efficiently, grow without chaos.

**Actions**:
- Manage product catalog (add, edit, deactivate)
- Set inventory levels
- View incoming order queue in real time
- Accept or reject orders (with reason)
- Mark orders as prepared
- Assign orders to couriers
- Manage courier roster
- Set store open/closed status

**Limitations**:
- Cannot see other merchants' data
- Cannot modify customer information
- Cannot force payment collection (Phase 1)
- Cannot access platform-level analytics

**Critical rule**: An order not responded to within the timeout window must be auto-flagged. The system must never silently drop an order.

### 5.3 Courier

**Who**: Delivery personnel employed by or contracted to a specific merchant.

**Primary motivation**: Complete deliveries efficiently with minimal friction.

**Actions**:
- View assigned delivery queue
- View delivery address and order details
- Confirm pickup from merchant
- Confirm delivery to customer
- Report failed delivery with reason

**Limitations**:
- Cannot create or modify orders
- Cannot self-assign to orders
- Cannot see other merchants' data
- Cannot see orders not assigned to them

**Phase 1 constraint**: Couriers are tied to one merchant. No sharing.

### 5.4 Admin

**Who**: SestaKibris platform operators (founding team initially).

**Primary motivation**: Ensure the platform is running and orders are flowing.

**Actions**:
- Onboard and verify merchants
- Monitor platform health
- Resolve disputes
- View all orders across merchants
- Override order states when necessary
- Manage feature flags

**Limitations**:
- Cannot place orders on behalf of customers
- Cannot operate as a merchant
- Admin actions must be logged — no invisible changes

---

## 6. PRODUCT IDENTITY

### Brand Promise

- **To merchants**: "You take the orders. We handle the system."
- **To customers**: "Order from your neighborhood. Get it at the door."

### Market Context

Northern Cyprus is experiencing rapid urbanization. Merchant customer bases are expanding beyond personal networks. The informal trust-based system is failing because **volume exceeds human memory and manual coordination capacity**.

The merchants who survive the next 5 years will be the ones who become operationally professional without losing neighborhood warmth.

---

## 7. ANTI-ROADMAP

These items are explicitly out of scope until a deliberate decision changes that:

- Restaurant / food preparation orders
- Scheduled future delivery
- In-app chat between customer and merchant
- Customer reviews of products
- Customer referral system
- Multi-merchant cart (marketplace checkout)
- Third-party seller marketplace
- Inventory forecasting / demand prediction AI
- Live GPS tracking of courier
- Automated pricing
- Cross-border delivery
- English-language customer interface (Phase 1)

---

## 8. GLOSSARY

| Term | Definition |
|---|---|
| **Merchant** | A business owner selling groceries, water, or gas via the platform |
| **Courier** | A delivery person assigned to and managed by a merchant |
| **Platform Courier** | Future courier type registered directly with SestaKibris (Phase 3+) |
| **Order Snapshot** | Copying address and price data into the order record at creation time |
| **RLS** | Row Level Security — Postgres feature enforcing data access at database layer |
| **COD** | Cash on Delivery — payment method in Phase 1 |
| **PWA** | Progressive Web App — mobile web app installable from browser |
| **State Machine** | Defined set of order states and their valid transitions |
| **Edge Function** | Serverless function hosted by Supabase |
| **Multi-Tenancy** | Architecture where multiple merchants share one platform and database |
| **Actor** | One of four user types: Customer, Merchant, Courier, Admin |

---

## 9. DECISION LOG

All architectural decisions that deviate from this document must be logged here.

| Date | Decision | Rationale | Approved By |
|---|---|---|---|
| 2026-05-14 | Document restructured from monolithic Bible to modular docs | Maintainability, parallel development, clearer ownership | Founding Team |

---

*This document is the single source of truth. All product, engineering, and business decisions are measured against the principles and constraints defined here.*
