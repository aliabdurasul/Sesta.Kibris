-- Migration: 00017_admin_rls_policies
-- Adds admin bypass policies to all operational tables.
--
-- PROBLEM: Admin dashboard uses the anon-key client + user JWT.
-- None of the existing RLS policies allow admin role unrestricted access,
-- so admin pages see empty results for orders, couriers, merchant lists, etc.
--
-- SOLUTION: For every table that admin needs to read or write,
-- add a policy: USING (public.user_role() = 'admin')
--
-- SECURITY NOTE: user_role() reads from JWT app_metadata.
-- Only the service role (server-side) can set app_metadata.
-- No client can self-elevate to admin via this mechanism.
--
-- Existing customer/merchant/courier isolation is NOT weakened
-- because those policies remain in place. Postgres evaluates
-- ALL policies with OR semantics — admin policy adds access,
-- it does not replace the existing restrictive policies.

-- ============================================================
-- MERCHANTS — admin can see all (including inactive)
-- ============================================================

DROP POLICY IF EXISTS merchants_admin_all ON merchants;
CREATE POLICY merchants_admin_all ON merchants
  FOR ALL
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- ============================================================
-- PRODUCTS — admin can manage all products
-- ============================================================

DROP POLICY IF EXISTS products_admin_all ON products;
CREATE POLICY products_admin_all ON products
  FOR ALL
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- ============================================================
-- CUSTOMERS — admin can read all profiles
-- ============================================================

DROP POLICY IF EXISTS customers_admin_select ON customers;
CREATE POLICY customers_admin_select ON customers
  FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================================
-- CUSTOMER_ADDRESSES — admin can read all
-- ============================================================

DROP POLICY IF EXISTS addresses_admin_select ON customer_addresses;
CREATE POLICY addresses_admin_select ON customer_addresses
  FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================================
-- COURIERS — admin can manage all couriers
-- ============================================================

DROP POLICY IF EXISTS couriers_admin_all ON couriers;
CREATE POLICY couriers_admin_all ON couriers
  FOR ALL
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- ============================================================
-- ORDERS — admin can see and update all orders
-- ============================================================

DROP POLICY IF EXISTS orders_admin_all ON orders;
CREATE POLICY orders_admin_all ON orders
  FOR ALL
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- ============================================================
-- ORDER_ITEMS — admin can see all
-- ============================================================

DROP POLICY IF EXISTS order_items_admin_select ON order_items;
CREATE POLICY order_items_admin_select ON order_items
  FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================================
-- ORDER_STATUS_LOG — admin can see all
-- ============================================================

DROP POLICY IF EXISTS status_log_admin_select ON order_status_log;
CREATE POLICY status_log_admin_select ON order_status_log
  FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================================
-- RLS: update customers policies to reference user_id
-- (Additive: old policies stay; new aliases added)
-- ============================================================

-- Allow admin-created customer rows (user_id != auth.uid() since service role inserted)
-- The existing policies use id = auth.uid() which works for existing rows.
-- After schema unification, user_id = id for all customers, so id = auth.uid() = user_id = auth.uid().
-- No change needed for customer self-access policies.

-- ============================================================
-- RLS: update merchants policies to allow merchant user_id lookup
-- ============================================================

-- Merchants select their own row by user_id (in addition to owner_user_id)
DROP POLICY IF EXISTS merchants_select_own_by_user_id ON merchants;
CREATE POLICY merchants_select_own_by_user_id ON merchants
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS merchants_update_own_by_user_id ON merchants;
CREATE POLICY merchants_update_own_by_user_id ON merchants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
