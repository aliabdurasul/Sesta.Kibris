-- ═══════════════════════════════════════════════════════════════════════════
-- LOCAL DEVELOPMENT ONLY — NEVER run on production Supabase
-- ═══════════════════════════════════════════════════════════════════════════
-- This file inserts fixed UUIDs (auth.users, merchants, couriers, orders).
-- Running it against production causes duplicate/conflicting rows and wrong
-- is_active/is_open state. Production data must come from admin UI + migrations.
--
-- Local:  supabase db reset   (migrations + this seed)
-- Prod:   supabase db push    (migrations only — no seed)
--
-- To fix production merchants stuck inactive (one-time, SQL editor):
--   UPDATE merchants SET is_active = true WHERE user_id IS NOT NULL;
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================================
-- AUTH USERS (created via Supabase auth.users insert)
-- In local dev, Supabase allows direct inserts to auth.users
-- ============================================================

-- Merchant users
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, encrypted_password, aud, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'market@example.com',
   '{"role":"merchant","merchant_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}',
   '{"full_name":"Ahmet Market"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated'),

  ('22222222-2222-2222-2222-222222222222', 'su@example.com',
   '{"role":"merchant","merchant_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}',
   '{"full_name":"Mehmet Su"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Customer users
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, encrypted_password, aud, role)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'musteri1@example.com',
   '{"role":"customer"}', '{"full_name":"Fatma Demir"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated'),

  ('44444444-4444-4444-4444-444444444444', 'musteri2@example.com',
   '{"role":"customer"}', '{"full_name":"Ali Kaya"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated'),

  ('55555555-5555-5555-5555-555555555555', 'musteri3@example.com',
   '{"role":"customer"}', '{"full_name":"Zeynep Celik"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Courier users
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, encrypted_password, aud, role)
VALUES
  ('66666666-6666-6666-6666-666666666666', 'kurye1@example.com',
   '{"role":"courier","courier_id":"cccccccc-cccc-cccc-cccc-cccccccccccc","merchant_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}',
   '{"full_name":"Kemal Yilmaz"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated'),

  ('77777777-7777-7777-7777-777777777777', 'kurye2@example.com',
   '{"role":"courier","courier_id":"dddddddd-dddd-dddd-dddd-dddddddddddd","merchant_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}',
   '{"full_name":"Bulent Ozturk"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated'),

  ('88888888-8888-8888-8888-888888888888', 'kurye3@example.com',
   '{"role":"courier","courier_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","merchant_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}',
   '{"full_name":"Sercan Arslan"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated'),

  ('99999999-9999-9999-9999-999999999999', 'kurye4@example.com',
   '{"role":"courier","courier_id":"ffffffff-ffff-ffff-ffff-ffffffffffff","merchant_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}',
   '{"full_name":"Hasan Celik"}',
   now(), now(), now(), '$2a$10$placeholder', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MERCHANTS (2 merchants: 1 grocery, 1 water)
-- ============================================================

INSERT INTO merchants (id, name, slug, category, owner_user_id, is_active, is_open, address, phone)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Ahmet Bey Market', 'ahmet-bey-market', 'grocery',
   '11111111-1111-1111-1111-111111111111',
   true, true, 'Lefkosa Merkez, No:12', '+90 548 111 1111'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Kuzey Su Deposu', 'kuzey-su', 'water',
   '22222222-2222-2222-2222-222222222222',
   true, true, 'Lefkosa Sanayi, No:5', '+90 548 222 2222')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCTS (10 per merchant = 20 total)
-- Prices in kurus (1 TL = 100 kurus)
-- ============================================================

INSERT INTO products (id, merchant_id, name, price, unit, is_available, display_order)
VALUES
  -- Grocery products
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sut (1L)',        750,   '1L',    true, 1),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ekmek',           300,   'adet',  true, 2),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Yumurta (12 li)', 4500,  'koli',  true, 3),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zeytin Yagi',     8000,  '500ml', true, 4),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Makarna',         1200,  '500g',  true, 5),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Domates (1kg)',   1500,  'kg',    true, 6),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Patates (1kg)',   900,   'kg',    true, 7),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Seker (1kg)',     2200,  'kg',    true, 8),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cay (200g)',      3500,  '200g',  true, 9),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Deterjan',        6000,  'adet',  true, 10),

  -- Water products
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Damacana Su (19L)',   12000, '19L',   true, 1),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Damacana Su (12L)',   8500,  '12L',   true, 2),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sise Su (1.5L)',      300,   '1.5L',  true, 3),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sise Su (0.5L)',      150,   '500ml', true, 4),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Koli Su (6x1.5L)',    1600,  'koli',  true, 5),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Koli Su (12x0.5L)',   1500,  'koli',  true, 6),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Maden Suyu (1L)',     600,   '1L',    true, 7),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Maden Suyu Koli',     3200,  'koli',  true, 8),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sodali Su (6lu)',     2800,  'koli',  true, 9),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Premium Su (5L)',     4500,  '5L',    true, 10);

-- ============================================================
-- CUSTOMERS
-- ============================================================

INSERT INTO customers (id, full_name, phone)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Fatma Demir',  '+90 548 333 3333'),
  ('44444444-4444-4444-4444-444444444444', 'Ali Kaya',     '+90 548 444 4444'),
  ('55555555-5555-5555-5555-555555555555', 'Zeynep Celik', '+90 548 555 5555')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CUSTOMER ADDRESSES
-- ============================================================

INSERT INTO customer_addresses (customer_id, label, address_line, district, city, is_default)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Ev',   'Ataturk Cad. No:45',     'Lefkosa Merkez', 'Lefkosa', true),
  ('33333333-3333-3333-3333-333333333333', 'Is',   'Sanayi Sok. No:8',       'Lefkosa Sanayi', 'Lefkosa', false),
  ('44444444-4444-4444-4444-444444444444', 'Ev',   'Gursel Cad. No:12',      'Kucuk Kaymakli', 'Lefkosa', true),
  ('55555555-5555-5555-5555-555555555555', 'Ev',   'Mehmetcik Sok. No:3',    'Yenisehir',      'Lefkosa', true),
  ('55555555-5555-5555-5555-555555555555', 'Anne', 'Yenikent Bulv. No:22',   'Haspolat',       'Lefkosa', false);

-- ============================================================
-- COURIERS (2 per merchant = 4 total)
-- ============================================================

INSERT INTO couriers (id, merchant_id, user_id, full_name, phone, is_active)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '66666666-6666-6666-6666-666666666666', 'Kemal Yilmaz', '+90 548 666 6666', true),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '77777777-7777-7777-7777-777777777777', 'Bulent Ozturk', '+90 548 777 7777', true),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '88888888-8888-8888-8888-888888888888', 'Sercan Arslan', '+90 548 888 8888', true),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '99999999-9999-9999-9999-999999999999', 'Hasan Celik', '+90 548 999 9999', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ORDERS (20 orders in various states)
-- Delivery address is a JSONB snapshot
-- ============================================================

-- Helper: reusable address snapshots
DO $$
DECLARE
  addr_fatma jsonb := '{"label":"Ev","address_line":"Ataturk Cad. No:45","district":"Lefkosa Merkez","city":"Lefkosa"}';
  addr_ali   jsonb := '{"label":"Ev","address_line":"Gursel Cad. No:12","district":"Kucuk Kaymakli","city":"Lefkosa"}';
  addr_zeynep jsonb := '{"label":"Ev","address_line":"Mehmetcik Sok. No:3","district":"Yenisehir","city":"Lefkosa"}';

  o1  uuid := gen_random_uuid();
  o2  uuid := gen_random_uuid();
  o3  uuid := gen_random_uuid();
  o4  uuid := gen_random_uuid();
  o5  uuid := gen_random_uuid();
  o6  uuid := gen_random_uuid();
  o7  uuid := gen_random_uuid();
  o8  uuid := gen_random_uuid();
  o9  uuid := gen_random_uuid();
  o10 uuid := gen_random_uuid();
  o11 uuid := gen_random_uuid();
  o12 uuid := gen_random_uuid();
  o13 uuid := gen_random_uuid();
  o14 uuid := gen_random_uuid();
  o15 uuid := gen_random_uuid();
  o16 uuid := gen_random_uuid();
  o17 uuid := gen_random_uuid();
  o18 uuid := gen_random_uuid();
  o19 uuid := gen_random_uuid();
  o20 uuid := gen_random_uuid();

  grocery_merchant uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  water_merchant   uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  customer1        uuid := '33333333-3333-3333-3333-333333333333';
  customer2        uuid := '44444444-4444-4444-4444-444444444444';
  customer3        uuid := '55555555-5555-5555-5555-555555555555';
  courier1         uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  courier3         uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

  first_grocery_product uuid;
  first_water_product   uuid;
BEGIN
  SELECT id INTO first_grocery_product FROM products WHERE merchant_id = grocery_merchant LIMIT 1;
  SELECT id INTO first_water_product   FROM products WHERE merchant_id = water_merchant   LIMIT 1;

  -- Orders 1-5: DELIVERED (grocery)
  INSERT INTO orders (id, merchant_id, customer_id, courier_id, status, total_amount, delivery_address, delivered_at)
  VALUES
    (o1,  grocery_merchant, customer1, courier1, 'DELIVERED', 2250, addr_fatma, now() - interval '2 hours'),
    (o2,  grocery_merchant, customer2, courier1, 'DELIVERED', 4500, addr_ali,   now() - interval '5 hours'),
    (o3,  grocery_merchant, customer3, courier1, 'DELIVERED', 1500, addr_zeynep,now() - interval '1 day'),
    (o4,  grocery_merchant, customer1, courier1, 'DELIVERED', 6000, addr_fatma, now() - interval '2 days'),
    (o5,  grocery_merchant, customer2, courier1, 'DELIVERED', 3200, addr_ali,   now() - interval '3 days');

  -- Orders 6-8: IN_TRANSIT (grocery)
  INSERT INTO orders (id, merchant_id, customer_id, courier_id, status, total_amount, delivery_address, assigned_at, picked_up_at)
  VALUES
    (o6,  grocery_merchant, customer1, courier1, 'IN_TRANSIT', 4500, addr_fatma, now() - interval '20 minutes', now() - interval '10 minutes'),
    (o7,  grocery_merchant, customer3, courier1, 'IN_TRANSIT', 1800, addr_zeynep,now() - interval '15 minutes', now() - interval '5 minutes'),
    (o8,  grocery_merchant, customer2, courier1, 'IN_TRANSIT', 3000, addr_ali,   now() - interval '25 minutes', now() - interval '8 minutes');

  -- Orders 9-10: ASSIGNED (grocery)
  INSERT INTO orders (id, merchant_id, customer_id, courier_id, status, total_amount, delivery_address, ready_at, assigned_at)
  VALUES
    (o9,  grocery_merchant, customer1, courier1, 'ASSIGNED', 2700, addr_fatma, now() - interval '30 minutes', now() - interval '5 minutes'),
    (o10, grocery_merchant, customer3, courier1, 'ASSIGNED', 5400, addr_zeynep,now() - interval '25 minutes', now() - interval '3 minutes');

  -- Orders 11-12: READY (grocery)
  INSERT INTO orders (id, merchant_id, customer_id, status, total_amount, delivery_address, accepted_at, ready_at)
  VALUES
    (o11, grocery_merchant, customer2, 'READY', 2100, addr_ali,   now() - interval '40 minutes', now() - interval '10 minutes'),
    (o12, grocery_merchant, customer1, 'READY', 3600, addr_fatma, now() - interval '35 minutes', now() - interval '5 minutes');

  -- Orders 13-14: CONFIRMED (grocery)
  INSERT INTO orders (id, merchant_id, customer_id, status, total_amount, delivery_address, accepted_at)
  VALUES
    (o13, grocery_merchant, customer3, 'CONFIRMED', 1350, addr_zeynep, now() - interval '10 minutes'),
    (o14, grocery_merchant, customer2, 'CONFIRMED', 4800, addr_ali,    now() - interval '8 minutes');

  -- Orders 15-16: PENDING (water)
  INSERT INTO orders (id, merchant_id, customer_id, status, total_amount, delivery_address)
  VALUES
    (o15, water_merchant, customer1, 'PENDING', 12000, addr_fatma),
    (o16, water_merchant, customer2, 'PENDING', 24000, addr_ali);

  -- Orders 17-18: DELIVERED (water)
  INSERT INTO orders (id, merchant_id, customer_id, courier_id, status, total_amount, delivery_address, delivered_at)
  VALUES
    (o17, water_merchant, customer3, courier3, 'DELIVERED', 12000, addr_zeynep, now() - interval '3 hours'),
    (o18, water_merchant, customer1, courier3, 'DELIVERED', 36000, addr_fatma,  now() - interval '1 day');

  -- Order 19: REJECTED
  INSERT INTO orders (id, merchant_id, customer_id, status, total_amount, delivery_address, rejection_reason)
  VALUES
    (o19, grocery_merchant, customer2, 'REJECTED', 900, addr_ali, 'Stok tukendi');

  -- Order 20: CANCELLED
  INSERT INTO orders (id, merchant_id, customer_id, status, total_amount, delivery_address)
  VALUES
    (o20, water_merchant, customer3, 'CANCELLED', 8500, addr_zeynep);

  -- Add order_items for PENDING orders and a few others
  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
  VALUES
    (o15, first_water_product, 'Damacana Su (19L)', 12000, 1, 12000),
    (o16, first_water_product, 'Damacana Su (19L)', 12000, 2, 24000),
    (o11, first_grocery_product, 'Sut (1L)',        750, 3, 2250) -- note: total doesn't need to match exactly for seed
  ;

  -- Status log entries for a few key orders
  INSERT INTO order_status_log (order_id, from_status, to_status, actor_id, actor_role)
  VALUES
    (o15, NULL,        'PENDING',   customer1, 'customer'),
    (o16, NULL,        'PENDING',   customer2, 'customer'),
    (o1,  NULL,        'PENDING',   customer1, 'customer'),
    (o1,  'PENDING',   'CONFIRMED', '11111111-1111-1111-1111-111111111111', 'merchant'),
    (o1,  'CONFIRMED', 'READY',     '11111111-1111-1111-1111-111111111111', 'merchant'),
    (o1,  'READY',     'ASSIGNED',  '11111111-1111-1111-1111-111111111111', 'merchant'),
    (o1,  'ASSIGNED',  'IN_TRANSIT','66666666-6666-6666-6666-666666666666', 'courier'),
    (o1,  'IN_TRANSIT','DELIVERED', '66666666-6666-6666-6666-666666666666', 'courier');

END $$;
