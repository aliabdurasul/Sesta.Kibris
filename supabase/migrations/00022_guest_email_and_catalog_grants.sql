-- Guest checkout: optional email + anon catalog access

ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email text;

COMMENT ON COLUMN orders.guest_email IS 'Optional guest contact email at checkout';

-- Ensure anon/authenticated can read public catalog (RLS still filters rows)
GRANT SELECT ON merchants TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;

-- Supplement public product read (idempotent; 00018 policy remains stricter)
DROP POLICY IF EXISTS products_select_anon_catalog ON products;
CREATE POLICY products_select_anon_catalog ON products
  FOR SELECT
  TO anon, authenticated
  USING (
    is_available = true
    AND EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = products.merchant_id AND m.is_active = true
    )
  );
