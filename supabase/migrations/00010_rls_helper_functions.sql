-- Migration: 00010_rls_helper_functions
-- JWT claim accessor functions used by all RLS policies
-- Per RLS_POLICIES.md section 2
-- Note: Functions are in public schema (auth schema is protected in Supabase)

-- Get the current user's role from JWT app_metadata
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_role() IS
  'Extracts role from JWT app_metadata. Returns: customer | merchant | courier | admin';

-- Get the current user's merchant_id from JWT app_metadata
CREATE OR REPLACE FUNCTION public.user_merchant_id()
RETURNS uuid AS $$
  SELECT (
    current_setting('request.jwt.claims', true)::json
    ->'app_metadata'->>'merchant_id'
  )::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_merchant_id() IS
  'Extracts merchant_id from JWT app_metadata for merchant RLS policies';

-- Get the current user's courier_id from JWT app_metadata
CREATE OR REPLACE FUNCTION public.user_courier_id()
RETURNS uuid AS $$
  SELECT (
    current_setting('request.jwt.claims', true)::json
    ->'app_metadata'->>'courier_id'
  )::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_courier_id() IS
  'Extracts courier_id from JWT app_metadata for courier RLS policies';
