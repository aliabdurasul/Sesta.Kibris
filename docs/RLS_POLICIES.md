# RLS POLICIES

## Row Level Security Policy Definitions

---

## 1. PRINCIPLE

RLS is the **true security boundary** of SestaKibris. Application-level WHERE clauses are performance optimizations. If all application code were removed, RLS alone must prevent unauthorized data access.

---

## 2. HELPER FUNCTIONS

These SQL functions are used within RLS policies:

```sql
-- Get the current user's role from JWT
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role')
  );
$$ LANGUAGE sql STABLE;

-- Get the current user's merchant_id from JWT
CREATE OR REPLACE FUNCTION auth.merchant_id()
RETURNS uuid AS $$
  SELECT (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'merchant_id')::uuid;
$$ LANGUAGE sql STABLE;

-- Get the current user's courier_id from JWT
CREATE OR REPLACE FUNCTION auth.courier_id()
RETURNS uuid AS $$
  SELECT (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'courier_id')::uuid;
$$ LANGUAGE sql STABLE;
```

---

## 3. POLICIES BY TABLE

### 3.1 merchants

| Operation | Policy Name | Rule |
|---|---|---|
| SELECT | `merchants_select_public` | Anyone can read active merchants (for storefront listing) |
| SELECT | `merchants_select_own` | Merchant can read their own record (including non-active) |
| UPDATE | `merchants_update_own` | Merchant can update their own record (is_open, phone, address) |
| INSERT | — | Only via service role (admin Edge Function) |
| DELETE | — | Never (soft delete via is_active) |

```sql
-- Public can see active merchants
CREATE POLICY merchants_select_public ON merchants
  FOR SELECT USING (is_active = true);

-- Merchant sees own record always
CREATE POLICY merchants_select_own ON merchants
  FOR SELECT USING (owner_user_id = auth.uid());

-- Merchant updates own record
CREATE POLICY merchants_update_own ON merchants
  FOR UPDATE USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());
```

### 3.2 products

| Operation | Policy Name | Rule |
|---|---|---|
| SELECT | `products_select_public` | Anyone can read available products of active merchants |
| SELECT | `products_select_merchant` | Merchant can read all their products (including unavailable) |
| INSERT | `products_insert_merchant` | Merchant can insert products for their own merchant_id |
| UPDATE | `products_update_merchant` | Merchant can update their own products |
| DELETE | — | Never (soft delete via is_available) |

```sql
-- Public sees available products
CREATE POLICY products_select_public ON products
  FOR SELECT USING (is_available = true);

-- Merchant sees all own products
CREATE POLICY products_select_merchant ON products
  FOR SELECT USING (merchant_id = auth.merchant_id());

-- Merchant inserts own products
CREATE POLICY products_insert_merchant ON products
  FOR INSERT WITH CHECK (merchant_id = auth.merchant_id());

-- Merchant updates own products
CREATE POLICY products_update_merchant ON products
  FOR UPDATE USING (merchant_id = auth.merchant_id())
  WITH CHECK (merchant_id = auth.merchant_id());
```

### 3.3 customers

| Operation | Policy Name | Rule |
|---|---|---|
| SELECT | `customers_select_own` | Customer can read their own record |
| UPDATE | `customers_update_own` | Customer can update their own record |
| INSERT | `customers_insert_own` | Customer can create their own record (on sign-up) |

```sql
CREATE POLICY customers_select_own ON customers
  FOR SELECT USING (id = auth.uid());

CREATE POLICY customers_update_own ON customers
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY customers_insert_own ON customers
  FOR INSERT WITH CHECK (id = auth.uid());
```

### 3.4 customer_addresses

| Operation | Policy Name | Rule |
|---|---|---|
| SELECT | `addresses_select_own` | Customer can read their own addresses |
| INSERT | `addresses_insert_own` | Customer can add addresses for themselves |
| UPDATE | `addresses_update_own` | Customer can edit their own addresses |
| DELETE | `addresses_delete_own` | Customer can delete their own addresses |

```sql
CREATE POLICY addresses_select_own ON customer_addresses
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY addresses_insert_own ON customer_addresses
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY addresses_update_own ON customer_addresses
  FOR UPDATE USING (customer_id = auth.uid());

CREATE POLICY addresses_delete_own ON customer_addresses
  FOR DELETE USING (customer_id = auth.uid());
```

### 3.5 couriers

| Operation | Policy Name | Rule |
|---|---|---|
| SELECT | `couriers_select_merchant` | Merchant can see their own couriers |
| SELECT | `couriers_select_own` | Courier can see their own record |
| UPDATE | `couriers_update_merchant` | Merchant can update their couriers (activate/deactivate) |
| INSERT | — | Only via service role (merchant Edge Function) |

```sql
CREATE POLICY couriers_select_merchant ON couriers
  FOR SELECT USING (merchant_id = auth.merchant_id());

CREATE POLICY couriers_select_own ON couriers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY couriers_update_merchant ON couriers
  FOR UPDATE USING (merchant_id = auth.merchant_id());
```

### 3.6 orders

| Operation | Policy Name | Rule |
|---|---|---|
| SELECT | `orders_select_customer` | Customer can see their own orders |
| SELECT | `orders_select_merchant` | Merchant can see orders for their merchant |
| SELECT | `orders_select_courier` | Courier can see orders assigned to them |
| INSERT | — | Only via Edge Function (create-order) |
| UPDATE | — | Only via Edge Function (transition-order-status) |

```sql
CREATE POLICY orders_select_customer ON orders
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY orders_select_merchant ON orders
  FOR SELECT USING (merchant_id = auth.merchant_id());

CREATE POLICY orders_select_courier ON orders
  FOR SELECT USING (courier_id = auth.courier_id());
```

### 3.7 order_items

| Operation | Policy Name | Rule |
|---|---|---|
| SELECT | `order_items_select_via_order` | Same visibility as parent order |
| INSERT | — | Only via Edge Function |
| UPDATE | — | Never (immutable after creation) |
| DELETE | — | Never |

```sql
-- Customer sees items of their orders
CREATE POLICY order_items_select_customer ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
  );

-- Merchant sees items of their orders
CREATE POLICY order_items_select_merchant ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.merchant_id = auth.merchant_id())
  );

-- Courier sees items of assigned orders
CREATE POLICY order_items_select_courier ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.courier_id = auth.courier_id())
  );
```

### 3.8 order_status_log

| Operation | Policy Name | Rule |
|---|---|---|
| SELECT | `status_log_select_via_order` | Same visibility as parent order |
| INSERT | — | Only via Edge Function (append-only) |
| UPDATE | — | Never |
| DELETE | — | Never |

```sql
CREATE POLICY status_log_select_merchant ON order_status_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_log.order_id AND orders.merchant_id = auth.merchant_id())
  );

CREATE POLICY status_log_select_customer ON order_status_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_log.order_id AND orders.customer_id = auth.uid())
  );
```

---

## 4. ADMIN BYPASS

Admin operations use the **service role key** which bypasses all RLS policies. This key is:
- Stored as an environment variable in Edge Functions
- NEVER exposed to any client-side code
- NEVER included in Next.js client bundles
- Used only in Edge Functions that validate admin role before executing

---

## 5. TESTING RLS POLICIES

Every RLS policy must have corresponding test cases:

| Test Type | Description |
|---|---|
| Positive | Actor CAN access data they own |
| Negative | Actor CANNOT access data they don't own |
| Cross-tenant | Merchant A cannot see Merchant B's data |
| Elevation | Courier cannot access merchant-only data |
| Public | Unauthenticated user can see public catalog data |

### Test Strategy

- Use Supabase CLI `supabase test` with pgTAP
- Create test users with specific roles
- Verify SELECT returns correct rows
- Verify INSERT/UPDATE is blocked for unauthorized actors
- Run as part of CI pipeline
