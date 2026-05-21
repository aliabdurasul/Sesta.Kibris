-- Migration: 00023_orders_realtime
-- Realtime prerequisites + courier RLS fallback (required for live refetch)

ALTER TABLE orders REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- Fallback when JWT app_metadata.courier_id is stale
DROP POLICY IF EXISTS orders_select_courier_by_user ON orders;
CREATE POLICY orders_select_courier_by_user ON orders
  FOR SELECT
  USING (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );
