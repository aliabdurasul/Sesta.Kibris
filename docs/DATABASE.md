# DATABASE

## Schema Design, Relationships, and Constraints

---

## 1. DESIGN PHILOSOPHY

- PostgreSQL is the single source of truth for all business state
- All tables that belong to a merchant include `merchant_id` for RLS isolation
- Prices stored as integers in lowest currency unit (kuruş) to avoid floating-point errors
- Timestamps are always `timestamptz` set by server `now()`
- UUIDs for all primary keys (Supabase default)
- Soft deletes via `is_active` / `is_available` flags — no hard deletes of business data

---

## 2. CORE TABLES

### 2.1 merchants

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| name | text | NOT NULL | Display name |
| slug | text | UNIQUE, NOT NULL | URL path segment |
| category | text | NOT NULL, CHECK (grocery, water, gas) | Merchant type |
| owner_user_id | uuid | FK → auth.users, UNIQUE | One user = one merchant |
| is_active | boolean | DEFAULT true | Admin can deactivate |
| is_open | boolean | DEFAULT false | Merchant controls availability |
| address | text | NOT NULL | Physical location |
| phone | text | NOT NULL | Contact number |
| order_timeout_minutes | integer | DEFAULT 15 | Auto-flag after this duration |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 2.2 products

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| merchant_id | uuid | FK → merchants, NOT NULL | RLS partition key |
| name | text | NOT NULL | Product name |
| description | text | | Optional description |
| price | integer | NOT NULL, CHECK (> 0) | In kuruş (1/100 TL) |
| unit | text | NOT NULL | e.g., "19L", "kg", "adet" |
| stock_count | integer | NULLABLE | NULL = unlimited stock |
| is_available | boolean | DEFAULT true | Can be toggled without delete |
| image_url | text | | Supabase Storage path |
| display_order | integer | DEFAULT 0 | Sort priority |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 2.3 customers

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, FK → auth.users | Maps to auth identity |
| full_name | text | NOT NULL | |
| phone | text | NOT NULL | |
| created_at | timestamptz | DEFAULT now() | |

### 2.4 customer_addresses

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| customer_id | uuid | FK → customers, NOT NULL | |
| label | text | NOT NULL | e.g., "Ev", "İş" |
| address_line | text | NOT NULL | Street address |
| district | text | NOT NULL | Neighborhood/area |
| city | text | DEFAULT 'Lefkoşa' | KKTC city |
| notes | text | | Delivery instructions |
| is_default | boolean | DEFAULT false | |
| created_at | timestamptz | DEFAULT now() | |

### 2.5 couriers

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| merchant_id | uuid | FK → merchants, NOT NULL | Tied to one merchant (Phase 1) |
| user_id | uuid | FK → auth.users, UNIQUE | Auth identity |
| full_name | text | NOT NULL | |
| phone | text | NOT NULL | |
| is_active | boolean | DEFAULT true | Merchant can deactivate |
| created_at | timestamptz | DEFAULT now() | |

### 2.6 orders

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| merchant_id | uuid | FK → merchants, NOT NULL | RLS partition key |
| customer_id | uuid | FK → customers, NOT NULL | |
| courier_id | uuid | FK → couriers, NULLABLE | Assigned later |
| status | text | NOT NULL, DEFAULT 'PENDING' | See state machine |
| total_amount | integer | NOT NULL, CHECK (> 0) | Calculated server-side |
| delivery_address | jsonb | NOT NULL | **Snapshot** — not FK |
| customer_notes | text | | |
| merchant_notes | text | | |
| rejection_reason | text | | Required when REJECTED |
| failure_reason | text | | Required when FAILED_DELIVERY |
| created_at | timestamptz | DEFAULT now() | |
| accepted_at | timestamptz | | Set on CONFIRMED |
| ready_at | timestamptz | | Set on READY |
| assigned_at | timestamptz | | Set on ASSIGNED |
| picked_up_at | timestamptz | | Set on IN_TRANSIT |
| delivered_at | timestamptz | | Set on DELIVERED |

**Status enum values**: PENDING, CONFIRMED, REJECTED, READY, ASSIGNED, IN_TRANSIT, DELIVERED, FAILED_DELIVERY, CANCELLED

### 2.7 order_items

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| order_id | uuid | FK → orders, NOT NULL | |
| product_id | uuid | FK → products, NOT NULL | Reference only |
| product_name | text | NOT NULL | **Snapshot** — not dynamic lookup |
| unit_price | integer | NOT NULL | **Snapshot** — price at order time |
| quantity | integer | NOT NULL, CHECK (> 0) | |
| line_total | integer | NOT NULL | unit_price × quantity |

### 2.8 order_status_log

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| order_id | uuid | FK → orders, NOT NULL | |
| from_status | text | | NULL for initial creation |
| to_status | text | NOT NULL | |
| actor_id | uuid | FK → auth.users, NOT NULL | Who triggered |
| actor_role | text | NOT NULL | customer, merchant, courier, admin |
| note | text | | Optional context |
| created_at | timestamptz | DEFAULT now() | |

**This table is APPEND-ONLY. No updates. No deletes.**

---

## 3. CRITICAL DESIGN DECISIONS

### 3.1 Delivery Address is a JSON Snapshot

When an order is placed, the delivery address is **copied** into `orders.delivery_address` as JSONB. If the customer later edits or deletes an address, historical orders retain the correct delivery address.

```json
{
  "label": "Ev",
  "address_line": "Atatürk Cad. No:15",
  "district": "Gönyeli",
  "city": "Lefkoşa",
  "notes": "Apartman giriş katta, sol kapı"
}
```

### 3.2 Product Price and Name are Snapshotted

`order_items.product_name` and `order_items.unit_price` are copied at order creation time. If a merchant changes a product price later, old orders still show the historical price. This is non-negotiable.

### 3.3 Order Total is Server-Calculated

`orders.total_amount` is computed by the Edge Function at order creation:
```
total_amount = SUM(order_items.line_total)
```
This value is NEVER accepted from the client.

### 3.4 Timestamps are Server-Set

All timestamp fields (`accepted_at`, `delivered_at`, etc.) are set via `now()` in Edge Functions or database triggers. Client-supplied timestamps are never trusted.

---

## 4. INDEXES

| Table | Index | Purpose |
|---|---|---|
| merchants | `idx_merchants_slug` (UNIQUE) | Storefront URL lookup |
| merchants | `idx_merchants_owner` (UNIQUE) | User → merchant mapping |
| products | `idx_products_merchant_id` | Catalog queries per merchant |
| products | `idx_products_merchant_available` | Active catalog filtering |
| orders | `idx_orders_merchant_id` | Merchant order queue |
| orders | `idx_orders_customer_id` | Customer order history |
| orders | `idx_orders_courier_id` | Courier delivery queue |
| orders | `idx_orders_status` | Status-based filtering |
| orders | `idx_orders_created_at` | Chronological ordering |
| order_items | `idx_order_items_order_id` | Order detail lookup |
| order_status_log | `idx_status_log_order_id` | Order audit trail |
| customer_addresses | `idx_addresses_customer_id` | Address book lookup |
| couriers | `idx_couriers_merchant_id` | Courier roster per merchant |

---

## 5. RELATIONSHIPS DIAGRAM

```
auth.users
    │
    ├── 1:1 → customers (id = auth.users.id)
    ├── 1:1 → merchants (owner_user_id)
    └── 1:1 → couriers (user_id)

merchants
    ├── 1:N → products
    ├── 1:N → couriers
    └── 1:N → orders

customers
    ├── 1:N → customer_addresses
    └── 1:N → orders

orders
    ├── 1:N → order_items
    ├── 1:N → order_status_log
    ├── N:1 → merchants
    ├── N:1 → customers
    └── N:1 → couriers (nullable)

order_items
    └── N:1 → products (reference only; data is snapshotted)
```

---

## 6. DATA INTEGRITY RULES

| Rule | Enforcement |
|---|---|
| Order total must equal sum of line totals | Edge Function at creation |
| Line total must equal unit_price × quantity | Edge Function at creation |
| Status can only follow valid transitions | Edge Function + database trigger |
| Terminal states (DELIVERED, REJECTED) are immutable | Database trigger / RLS policy |
| Merchant can only have one owner | UNIQUE constraint on owner_user_id |
| Courier tied to exactly one merchant | FK + merchant_id on couriers table |
| Product price must be positive | CHECK constraint |
| Order must have at least one item | Edge Function validation |
| Rejection reason required for REJECTED status | Edge Function validation |

---

## 7. MIGRATION STRATEGY

- All schema changes managed via Supabase CLI migrations
- Migrations are version-controlled in `supabase/migrations/`
- Every migration must be reversible (include `down` migration)
- RLS policies are part of migrations (not applied manually)
- Seed data only for development; never for production
