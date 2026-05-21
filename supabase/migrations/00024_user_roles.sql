-- Migration: 00024_user_roles
-- Multi-role support: same user can be merchant + courier (+ customer, admin)

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('customer', 'merchant', 'courier', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

COMMENT ON TABLE user_roles IS 'All roles granted to a user — JWT app_metadata.role is the active role';

-- Backfill from profile tables (idempotent)
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'customer' FROM customers
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT DISTINCT COALESCE(user_id, owner_user_id), 'merchant'
FROM merchants
WHERE COALESCE(user_id, owner_user_id) IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT user_id, 'courier' FROM couriers
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.user_has_role(check_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = check_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_has_role IS 'True if current user has role in user_roles table';

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_select_own ON user_roles;
CREATE POLICY user_roles_select_own ON user_roles
  FOR SELECT
  USING (user_id = auth.uid());
