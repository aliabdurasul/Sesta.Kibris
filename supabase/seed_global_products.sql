-- ═══════════════════════════════════════════════════════════════════════════════
-- seed_global_products.sql
-- 150 Cyprus grocery products for the global_products catalog.
--
-- ENVIRONMENT: Production-safe.
--   Run ONCE after the admin user is created (/setup-admin) and migrations
--   00034-00040 have been applied.
--
-- PREREQUISITE: At least one user with role='admin' must exist in user_roles.
--   If no admin found → raises exception with clear message.
--
-- IDEMPOTENT: Uses ON CONFLICT (slug) DO NOTHING, so safe to re-run.
--
-- CATEGORIES: Assumes migration 00035 seeded the 12 categories. Uses slug
--   lookups (not hardcoded UUIDs) so this file works across all environments.
--
-- IMAGES: image_url left NULL. Admin uploads via /admin/catalog/[id]/edit.
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_admin_id uuid;

  -- Category IDs (looked up by slug)
  c_sut_yumurta    uuid;
  c_ekmek_unlu     uuid;
  c_et_sarkuteri   uuid;
  c_meyve_sebze    uuid;
  c_dondurulmus    uuid;
  c_icecekler      uuid;
  c_temizlik       uuid;
  c_kisisel_bakim  uuid;
  c_kahvaltilik    uuid;
  c_bakliyat_tahil uuid;
  c_atistirmalik   uuid;
  c_su_gazli       uuid;

BEGIN

  -- ── Resolve admin user ─────────────────────────────────────────────────────
  SELECT user_id INTO v_admin_id
  FROM user_roles
  WHERE role = 'admin'
  ORDER BY created_at
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION
      'SEED_ERROR: No admin user found in user_roles. '
      'Create an admin account via /setup-admin before running this seed.'
      USING ERRCODE = 'P0003';
  END IF;

  -- ── Resolve category IDs ───────────────────────────────────────────────────
  SELECT id INTO c_sut_yumurta    FROM product_categories WHERE slug = 'sut-yumurta';
  SELECT id INTO c_ekmek_unlu     FROM product_categories WHERE slug = 'ekmek-unlu';
  SELECT id INTO c_et_sarkuteri   FROM product_categories WHERE slug = 'et-sarkuteri';
  SELECT id INTO c_meyve_sebze    FROM product_categories WHERE slug = 'meyve-sebze';
  SELECT id INTO c_dondurulmus    FROM product_categories WHERE slug = 'dondurulmus';
  SELECT id INTO c_icecekler      FROM product_categories WHERE slug = 'icecekler';
  SELECT id INTO c_temizlik       FROM product_categories WHERE slug = 'temizlik';
  SELECT id INTO c_kisisel_bakim  FROM product_categories WHERE slug = 'kisisel-bakim';
  SELECT id INTO c_kahvaltilik    FROM product_categories WHERE slug = 'kahvaltilik';
  SELECT id INTO c_bakliyat_tahil FROM product_categories WHERE slug = 'bakliyat-tahil';
  SELECT id INTO c_atistirmalik   FROM product_categories WHERE slug = 'atistirmalik';
  SELECT id INTO c_su_gazli       FROM product_categories WHERE slug = 'su-gazli';

  -- ── INSERT 150 products ────────────────────────────────────────────────────
  -- Columns: category_id, name, slug, brand, unit, description, tags, created_by
  -- Prices are NOT set here — merchants set their own prices via merchant_inventory.
  -- image_url is NULL — admin uploads via Admin UI.

  INSERT INTO global_products
    (category_id, name, slug, brand, unit, description, tags, created_by)
  VALUES

  -- ════════════════════════════════════════════════════════════════════════════
  -- 1. SÜT & YUMURTA (15 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_sut_yumurta, 'Tam Yağlı Süt',        'tam-yagli-sut-1l',       NULL,    '1L',    'Günlük pastörize tam yağlı süt.',          ARRAY['süt','dairy','tam yağlı'],             v_admin_id),
  (c_sut_yumurta, 'Yarım Yağlı Süt',      'yarim-yagli-sut-1l',     NULL,    '1L',    'Günlük pastörize yarım yağlı süt.',        ARRAY['süt','dairy','yarım yağlı'],           v_admin_id),
  (c_sut_yumurta, 'Yağsız Süt',           'yagsiz-sut-1l',          NULL,    '1L',    'Yağı alınmış pastörize süt.',              ARRAY['süt','dairy','yağsız','light'],        v_admin_id),
  (c_sut_yumurta, 'UHT Süt',              'uht-sut-1l',             NULL,    '1L',    'Uzun ömürlü UHT işlem görmüş süt.',        ARRAY['süt','uht','uzun ömürlü'],             v_admin_id),
  (c_sut_yumurta, 'Yumurta (12''li)',     'yumurta-12li',           NULL,    'koli',  '12 adet kahverengi/beyaz yumurta.',         ARRAY['yumurta','egg','12li'],                v_admin_id),
  (c_sut_yumurta, 'Yumurta (6''lı)',      'yumurta-6li',            NULL,    'koli',  '6 adet yumurta.',                           ARRAY['yumurta','egg','6li'],                 v_admin_id),
  (c_sut_yumurta, 'Beyaz Peynir',         'beyaz-peynir-500g',      NULL,    '500g',  'Salamura beyaz peynir.',                    ARRAY['peynir','cheese','beyaz'],             v_admin_id),
  (c_sut_yumurta, 'Kaşar Peyniri',        'kasar-peyniri-200g',     NULL,    '200g',  'Dilimlenmiş ya da blok kaşar peyniri.',     ARRAY['peynir','cheese','kaşar'],             v_admin_id),
  (c_sut_yumurta, 'Tam Yağlı Yoğurt',    'tam-yagli-yogurt-1kg',   NULL,    '1kg',   'Katkısız tam yağlı süt yoğurdu.',           ARRAY['yoğurt','yogurt','tam yağlı'],         v_admin_id),
  (c_sut_yumurta, 'Az Yağlı Yoğurt',     'az-yagli-yogurt-500g',   NULL,    '500g',  'Düşük yağlı süt yoğurdu.',                 ARRAY['yoğurt','yogurt','light'],             v_admin_id),
  (c_sut_yumurta, 'Krem Peynir',          'krem-peynir-200g',       NULL,    '200g',  'Sürülebilir krem peynir.',                  ARRAY['peynir','krem','sürülebilir'],         v_admin_id),
  (c_sut_yumurta, 'Tereyağı',             'tereyagi-250g',          NULL,    '250g',  'Pastörize tam yağlı tereyağı.',             ARRAY['tereyağı','butter','yağ'],             v_admin_id),
  (c_sut_yumurta, 'Margarin',             'margarin-250g',          NULL,    '250g',  'Bitkisel yağlı margarin.',                  ARRAY['margarin','yağ','bitkisel'],           v_admin_id),
  (c_sut_yumurta, 'Ayran',               'ayran-500ml',            NULL,    '500ml', 'Soğuk içilebilir tuzlu ayran.',             ARRAY['ayran','içecek','süt ürünü'],          v_admin_id),
  (c_sut_yumurta, 'Kefir',               'kefir-500ml',            NULL,    '500ml', 'Fermente sütlü kefir içeceği.',             ARRAY['kefir','probiyotik','fermente'],        v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 2. EKMEK & UNLU (12 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_ekmek_unlu,  'Beyaz Ekmek',          'beyaz-ekmek',            NULL,    'adet',  'Günlük pişmiş beyaz buğday ekmeği.',        ARRAY['ekmek','bread','beyaz'],               v_admin_id),
  (c_ekmek_unlu,  'Tam Buğday Ekmeği',   'tam-bugday-ekmegi',      NULL,    'adet',  'Kepekli tam buğday unu ile pişirilmiş.',    ARRAY['ekmek','bread','tam buğday','kepekli'], v_admin_id),
  (c_ekmek_unlu,  'Tost Ekmeği',         'tost-ekmegi',            NULL,    'adet',  '12 dilimli tost için ince dilimli ekmek.',  ARRAY['ekmek','tost','dilimli'],              v_admin_id),
  (c_ekmek_unlu,  'Çavdar Ekmeği',       'cavdar-ekmegi',          NULL,    'adet',  'Çavdar unu karışımlı sağlıklı ekmek.',      ARRAY['ekmek','çavdar','rye'],                v_admin_id),
  (c_ekmek_unlu,  'Pide',                'pide',                   NULL,    'adet',  'Geleneksel Türk pidesi.',                   ARRAY['pide','ekmek','geleneksel'],           v_admin_id),
  (c_ekmek_unlu,  'Un',                  'un-1kg',                 NULL,    '1kg',   'Buğday unu, tip 550.',                      ARRAY['un','flour','hamur'],                  v_admin_id),
  (c_ekmek_unlu,  'Mısır Unu',           'misir-unu-500g',         NULL,    '500g',  'İnce öğütülmüş mısır unu.',                 ARRAY['mısır unu','corn flour','glutensiz'],  v_admin_id),
  (c_ekmek_unlu,  'İrmik',               'irmik-500g',             NULL,    '500g',  'İnce ya da kaba irmik.',                    ARRAY['irmik','semolina','hamur'],            v_admin_id),
  (c_ekmek_unlu,  'Nişasta',             'nisasta-500g',           NULL,    '500g',  'Mısır ya da buğday nişastası.',             ARRAY['nişasta','starch','pişirme'],          v_admin_id),
  (c_ekmek_unlu,  'Bisküvi',             'biskuvi-200g',           NULL,    '200g',  'Sade ya da kakaolu bisküvi.',               ARRAY['bisküvi','atıştırmalık','kahvaltı'],   v_admin_id),
  (c_ekmek_unlu,  'Kraker',              'kraker-150g',            NULL,    '150g',  'Tuzlu ince kraker.',                        ARRAY['kraker','cracker','tuzlu'],            v_admin_id),
  (c_ekmek_unlu,  'Simit',               'simit',                  NULL,    'adet',  'Susam kaplı geleneksel simit.',             ARRAY['simit','susam','kahvaltı'],            v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 3. ET & ŞARKÜTERİ (10 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_et_sarkuteri, 'Sucuk',              'sucuk-200g',             NULL,    '200g',  'Fermente edilmiş sığır sucuğu.',            ARRAY['sucuk','sosis','et ürünü'],            v_admin_id),
  (c_et_sarkuteri, 'Salam',              'salam-150g',             NULL,    '150g',  'Hindi ya da sığır salamı.',                 ARRAY['salam','şarküteri','et'],              v_admin_id),
  (c_et_sarkuteri, 'Tavuk Göğsü',       'tavuk-gogsu-500g',       NULL,    '500g',  'Taze ya da dondurulmuş tavuk göğsü.',       ARRAY['tavuk','chicken','et','protein'],      v_admin_id),
  (c_et_sarkuteri, 'Kıyma',             'kiyma-500g',             NULL,    '500g',  'Dana ya da karışık kıyma.',                 ARRAY['kıyma','minced','et','dana'],          v_admin_id),
  (c_et_sarkuteri, 'Pastırma',          'pastirma-100g',          NULL,    '100g',  'Geleneksel Türk pastırması.',               ARRAY['pastırma','et','şarküteri'],           v_admin_id),
  (c_et_sarkuteri, 'Sosis',             'sosis-300g',             NULL,    '300g',  'Pişirmeye hazır dana ya da hindi sosisi.',  ARRAY['sosis','sausage','et'],                v_admin_id),
  (c_et_sarkuteri, 'Jambon',            'jambon-150g',            NULL,    '150g',  'Dilimlenmiş hindi ya da dana jambonu.',     ARRAY['jambon','ham','şarküteri'],            v_admin_id),
  (c_et_sarkuteri, 'Ton Balığı',        'ton-baligi-160g',        NULL,    '160g',  'Zeytinyağlı konserve ton balığı.',          ARRAY['ton balığı','balık','konserve','deniz'],v_admin_id),
  (c_et_sarkuteri, 'Sardalye',          'sardalye-120g',          NULL,    '120g',  'Doğal suda ya da zeytinyağında sardalye.',  ARRAY['sardalye','balık','konserve'],         v_admin_id),
  (c_et_sarkuteri, 'Dana Bonfile',      'dana-bonfile-500g',      NULL,    '500g',  'Taze dana bonfile fileto.',                 ARRAY['dana','bonfile','et','lüks'],          v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 4. MEYVE & SEBZE (20 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_meyve_sebze, 'Domates',            'domates-1kg',            NULL,    'kg',    'Taze kırmızı domates.',                     ARRAY['domates','tomato','sebze','taze'],      v_admin_id),
  (c_meyve_sebze, 'Patates',            'patates-1kg',            NULL,    'kg',    'Taze patates.',                             ARRAY['patates','potato','sebze'],            v_admin_id),
  (c_meyve_sebze, 'Soğan',             'sogan-1kg',              NULL,    'kg',    'Kuru soğan.',                               ARRAY['soğan','onion','sebze'],               v_admin_id),
  (c_meyve_sebze, 'Havuç',             'havuc-1kg',              NULL,    'kg',    'Taze turuncu havuç.',                       ARRAY['havuç','carrot','sebze'],              v_admin_id),
  (c_meyve_sebze, 'Biber',             'biber-500g',             NULL,    '500g',  'Sivri ya da dolmalık biber.',               ARRAY['biber','pepper','sebze'],              v_admin_id),
  (c_meyve_sebze, 'Patlıcan',          'patlican-1kg',           NULL,    'kg',    'Taze mor patlıcan.',                        ARRAY['patlıcan','eggplant','sebze'],         v_admin_id),
  (c_meyve_sebze, 'Kabak',             'kabak-1kg',              NULL,    'kg',    'Yeşil ya da sarı kabak.',                   ARRAY['kabak','zucchini','sebze'],            v_admin_id),
  (c_meyve_sebze, 'Ispanak',           'ispanak-500g',           NULL,    '500g',  'Taze taze ıspanak.',                        ARRAY['ıspanak','spinach','yeşil sebze'],     v_admin_id),
  (c_meyve_sebze, 'Muz',               'muz-1kg',                NULL,    'kg',    'Taze tropik muz.',                          ARRAY['muz','banana','meyve'],                v_admin_id),
  (c_meyve_sebze, 'Elma',              'elma-1kg',               NULL,    'kg',    'Kırmızı ya da yeşil taze elma.',            ARRAY['elma','apple','meyve'],                v_admin_id),
  (c_meyve_sebze, 'Portakal',          'portakal-1kg',           NULL,    'kg',    'Taze sıkılık portakal.',                    ARRAY['portakal','orange','meyve','c vitamini'],v_admin_id),
  (c_meyve_sebze, 'Limon',             'limon-1kg',              NULL,    'kg',    'Taze sarı limon.',                          ARRAY['limon','lemon','meyve','asit'],        v_admin_id),
  (c_meyve_sebze, 'Mandalina',         'mandalina-1kg',          NULL,    'kg',    'Soyulması kolay taze mandalina.',           ARRAY['mandalina','tangerine','meyve'],       v_admin_id),
  (c_meyve_sebze, 'Üzüm',             'uzum-500g',              NULL,    '500g',  'Çekirdeksiz ya da çekirdekli taze üzüm.',   ARRAY['üzüm','grape','meyve'],                v_admin_id),
  (c_meyve_sebze, 'Karpuz',            'karpuz-adet',            NULL,    'adet',  'Taze bütün karpuz (mevsimsel).',            ARRAY['karpuz','watermelon','meyve','yaz'],   v_admin_id),
  (c_meyve_sebze, 'Kavun',             'kavun-adet',             NULL,    'adet',  'Taze bütün kavun (mevsimsel).',             ARRAY['kavun','melon','meyve','yaz'],         v_admin_id),
  (c_meyve_sebze, 'Sarımsak',          'sarimsak-250g',          NULL,    '250g',  'Taze ya da kuru sarımsak başı.',            ARRAY['sarımsak','garlic','baharat'],         v_admin_id),
  (c_meyve_sebze, 'Maydanoz',          'maydanoz-demet',         NULL,    'demet', 'Taze maydanoz demeti.',                     ARRAY['maydanoz','parsley','ot','yeşil'],     v_admin_id),
  (c_meyve_sebze, 'Nane',              'nane-demet',             NULL,    'demet', 'Taze nane demeti.',                         ARRAY['nane','mint','ot','çay'],              v_admin_id),
  (c_meyve_sebze, 'Salatalık',         'salatalik-1kg',          NULL,    'kg',    'Taze yeşil salatalık.',                     ARRAY['salatalık','cucumber','sebze'],        v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 5. DONDURULMUŞ (8 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_dondurulmus, 'Dondurulmuş Bezelye',       'dondurulmus-bezelye-500g',      NULL,'500g','Çabuk dondurulmuş yeşil bezelye.',       ARRAY['bezelye','dondurulmuş','sebze'],       v_admin_id),
  (c_dondurulmus, 'Dondurulmuş Mısır',         'dondurulmus-misir-500g',        NULL,'500g','Çabuk dondurulmuş mısır tanesi.',         ARRAY['mısır','dondurulmuş','sebze'],         v_admin_id),
  (c_dondurulmus, 'Dondurulmuş Ispanak',       'dondurulmus-ispanak-500g',      NULL,'500g','Doğranmış dondurulmuş ıspanak.',          ARRAY['ıspanak','dondurulmuş','yeşil'],       v_admin_id),
  (c_dondurulmus, 'Dondurulmuş Patates Kızartması','dond-patates-kizartmasi-750g',NULL,'750g','Önceden pişirilmiş dondurulmuş patates.', ARRAY['patates','kızartma','dondurulmuş'],    v_admin_id),
  (c_dondurulmus, 'Dondurulmuş Karışık Sebze', 'dond-karisik-sebze-500g',       NULL,'500g','Karışık dondurulmuş sebze paketi.',       ARRAY['karışık sebze','dondurulmuş'],         v_admin_id),
  (c_dondurulmus, 'Dondurulmuş Tavuk But',     'dond-tavuk-but-1kg',            NULL,'1kg', 'Dondurulmuş tavuk but parçaları.',         ARRAY['tavuk','dondurulmuş','et'],            v_admin_id),
  (c_dondurulmus, 'Dondurulmuş Deniz Ürünleri','dond-deniz-urunleri-500g',      NULL,'500g','Karışık dondurulmuş deniz ürünleri.',     ARRAY['deniz ürünü','seafood','dondurulmuş'], v_admin_id),
  (c_dondurulmus, 'Dondurma',                  'dondurma-1l',                   NULL,'1L',  'Çikolata, vanilya ya da çilek dondurma.',  ARRAY['dondurma','ice cream','tatlı'],         v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 6. İÇECEKLER (15 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_icecekler, 'Çay',                  'cay-200g',               NULL,    '200g',  'Karadeniz tipi siyah çay.',                 ARRAY['çay','tea','içecek','sıcak'],          v_admin_id),
  (c_icecekler, 'Filtre Kahve',         'filtre-kahve-250g',      NULL,    '250g',  'Öğütülmüş filtre kahve.',                   ARRAY['kahve','coffee','filtre'],             v_admin_id),
  (c_icecekler, 'Türk Kahvesi',         'turk-kahvesi-100g',      NULL,    '100g',  'İnce öğütülmüş Türk kahvesi.',              ARRAY['türk kahvesi','coffee','içecek'],      v_admin_id),
  (c_icecekler, 'Nescafé',             'nescafe-100g',           'Nescafé','100g', 'Granül hazır kahve.',                       ARRAY['nescafe','hazır kahve','coffee'],      v_admin_id),
  (c_icecekler, 'Kola (1.5L)',         'kola-1-5l',              NULL,    '1.5L',  'Şekerli karbonatlı kola içeceği.',          ARRAY['kola','cola','gazlı','içecek'],        v_admin_id),
  (c_icecekler, 'Limonata (1.5L)',     'limonata-1-5l',          NULL,    '1.5L',  'Taze ya da şişelenmiş limonata.',           ARRAY['limonata','lemonade','gazlı'],         v_admin_id),
  (c_icecekler, 'Portakal Suyu (1L)',  'portakal-suyu-1l',       NULL,    '1L',    '% 100 portakal suyu ya da nektar.',          ARRAY['portakal suyu','meyve suyu','vitamin'],v_admin_id),
  (c_icecekler, 'Elma Suyu (1L)',      'elma-suyu-1l',           NULL,    '1L',    '% 100 elma suyu.',                          ARRAY['elma suyu','meyve suyu'],              v_admin_id),
  (c_icecekler, 'Enerji İçeceği',     'enerji-icecegi-250ml',   NULL,    '250ml', 'Kafeinli enerji içeceği.',                  ARRAY['enerji içeceği','energy drink','kafein'],v_admin_id),
  (c_icecekler, 'Hazır Çay (Şişe)',   'hazir-cay-500ml',        NULL,    '500ml', 'Şişelenmiş soğuk çay (limon ya da şeftali)',ARRAY['soğuk çay','ice tea','şişe'],         v_admin_id),
  (c_icecekler, 'Boza',               'boza-500ml',             NULL,    '500ml', 'Geleneksel fermente boza içeceği.',         ARRAY['boza','fermente','geleneksel'],        v_admin_id),
  (c_icecekler, 'Şalgam Suyu',        'salgam-suyu-330ml',      NULL,    '330ml', 'Ekşi fermente şalgam suyu.',                ARRAY['şalgam','fermente','ekşi','içecek'],   v_admin_id),
  (c_icecekler, 'Şeker (Toz, 1kg)',   'seker-toz-1kg',          NULL,    '1kg',   'Rafine beyaz toz şeker.',                   ARRAY['şeker','sugar','tatlandırıcı'],        v_admin_id),
  (c_icecekler, 'Kakao (500g)',        'kakao-500g',             NULL,    '500g',  'Şekerli hazır kakao tozu.',                 ARRAY['kakao','cocoa','çikolata','içecek'],   v_admin_id),
  (c_icecekler, 'Salep (200g)',        'salep-200g',             NULL,    '200g',  'Geleneksel Türk salebi tozu.',              ARRAY['salep','sıcak içecek','kış'],          v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 7. TEMİZLİK (15 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_temizlik, 'Toz Deterjan',         'toz-deterjan-3kg',       NULL,    '3kg',   'Çamaşır makinesi için toz deterjan.',       ARRAY['deterjan','laundry','temizlik','çamaşır'],v_admin_id),
  (c_temizlik, 'Sıvı Deterjan',        'sivi-deterjan-3l',       NULL,    '3L',    'Çamaşır makinesi için sıvı deterjan.',      ARRAY['deterjan','liquid','temizlik'],        v_admin_id),
  (c_temizlik, 'Bulaşık Deterjanı',   'bulasik-deterjani-750ml', NULL,   '750ml', 'El bulaşığı için sıvı deterjan.',           ARRAY['bulaşık','dishwashing','deterjan'],    v_admin_id),
  (c_temizlik, 'Bulaşık Makinesi Tableti','bulasik-tableti-30lu',NULL,    '30 adet','Bulaşık makinesi deterjan tableti.',       ARRAY['bulaşık makinesi','tablet','deterjan'],v_admin_id),
  (c_temizlik, 'Çamaşır Suyu',        'camasir-suyu-2l',        NULL,    '2L',    'Çok amaçlı dezenfektanlı çamaşır suyu.',   ARRAY['çamaşır suyu','bleach','dezenfektan'], v_admin_id),
  (c_temizlik, 'Yüzey Temizleyici',   'yuzey-temizleyici-750ml',NULL,    '750ml', 'Çok yüzeyli genel temizlik spreyi.',        ARRAY['temizlik','spray','genel'],            v_admin_id),
  (c_temizlik, 'WC Temizleyici',      'wc-temizleyici-750ml',   NULL,    '750ml', 'Tuvalet ve banyo için asidik temizleyici.', ARRAY['wc','tuvalet','temizlik'],             v_admin_id),
  (c_temizlik, 'Cam Temizleyici',     'cam-temizleyici-500ml',  NULL,    '500ml', 'Cam ve ayna için leke bırakmayan sprey.',   ARRAY['cam','glass','temizlik'],              v_admin_id),
  (c_temizlik, 'Tuvalet Kağıdı',     'tuvalet-kagidi-12li',    NULL,    '12 rulo','12 rulo tuvalet kağıdı.',                  ARRAY['tuvalet kağıdı','kağıt','hijyen'],     v_admin_id),
  (c_temizlik, 'Kağıt Havlu',        'kagit-havlu-4lu',        NULL,    '4 rulo', '4 rulo emici kağıt havlu.',                ARRAY['kağıt havlu','mutfak','temizlik'],     v_admin_id),
  (c_temizlik, 'Islak Mendil',        'islak-mendil-72li',      NULL,    '72 adet','Alkollü ya da alkolsüz ıslak mendil.',     ARRAY['ıslak mendil','wipes','hijyen'],       v_admin_id),
  (c_temizlik, 'Çöp Torbası (Büyük)','cop-torbasi-buyuk-20li',  NULL,    '20 adet','40-60 litre çöp torbası.',                 ARRAY['çöp torbası','trash bag','temizlik'],  v_admin_id),
  (c_temizlik, 'Bulaşık Süngeri',    'bulasik-sungeri-5li',    NULL,    '5 adet', 'Çift taraflı mutfak süngeri.',             ARRAY['sünger','bulaşık','mutfak'],           v_admin_id),
  (c_temizlik, 'Temizlik Eldiveni',  'temizlik-eldiveni-l',    NULL,    'çift',   'Lateks temizlik eldiveni (M/L/XL).',        ARRAY['eldiven','glove','temizlik'],          v_admin_id),
  (c_temizlik, 'Yumuşatıcı',         'camasir-yumusatici-1l',  NULL,    '1L',    'Çamaşır kumaş yumuşatıcı.',                ARRAY['yumuşatıcı','fabric softener','çamaşır'],v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 8. KİŞİSEL BAKIM (10 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_kisisel_bakim,'Şampuan',          'sampuan-400ml',          NULL,    '400ml', 'Normal / yağlı / kuru saç için şampuan.',   ARRAY['şampuan','shampoo','saç'],             v_admin_id),
  (c_kisisel_bakim,'Saç Kremi',        'sac-kremi-250ml',        NULL,    '250ml', 'Besleyici saç kremi.',                      ARRAY['saç kremi','conditioner','saç'],       v_admin_id),
  (c_kisisel_bakim,'Sabun',            'sabun-4lu',              NULL,    '4 adet','Katı ya da sıvı sabun.',                    ARRAY['sabun','soap','hijyen'],               v_admin_id),
  (c_kisisel_bakim,'Sıvı El Sabunu',  'sivi-el-sabunu-300ml',   NULL,    '300ml', 'Bakteri önleyici sıvı el sabunu.',          ARRAY['sıvı sabun','el sabunu','hijyen'],     v_admin_id),
  (c_kisisel_bakim,'Diş Macunu',       'dis-macunu-100ml',       NULL,    '100ml', 'Flüorürlü beyazlatıcı diş macunu.',         ARRAY['diş macunu','toothpaste','ağız'],      v_admin_id),
  (c_kisisel_bakim,'Diş Fırçası',     'dis-fircasi',            NULL,    'adet',  'Yumuşak ya da orta sert diş fırçası.',      ARRAY['diş fırçası','toothbrush','ağız'],     v_admin_id),
  (c_kisisel_bakim,'Deodorant',        'deodorant-150ml',        NULL,    '150ml', 'Ter önleyici roll-on ya da sprey deodorant.',ARRAY['deodorant','antiperspirant','kişisel'],v_admin_id),
  (c_kisisel_bakim,'Tıraş Köpüğü',   'tiras-kopugu-200ml',     NULL,    '200ml', 'Hassas ya da normal cilt için tıraş köpüğü.',ARRAY['tıraş','shaving','erkek'],            v_admin_id),
  (c_kisisel_bakim,'Vücut Losyonu',   'vucut-losyonu-400ml',    NULL,    '400ml', 'Nemlendirici vücut losyonu.',               ARRAY['losyon','moisturizer','vücut'],        v_admin_id),
  (c_kisisel_bakim,'Pamuk (50g)',      'pamuk-50g',              NULL,    '50g',   'Yüz temizleme pamuğu.',                     ARRAY['pamuk','cotton','temizlik','yüz'],      v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 9. KAHVALTILIK (12 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_kahvaltilik,'Siyah Zeytin',       'siyah-zeytin-500g',      NULL,    '500g',  'Salamura ya da tuzlanmış siyah zeytin.',    ARRAY['zeytin','olive','kahvaltı'],           v_admin_id),
  (c_kahvaltilik,'Yeşil Zeytin',       'yesil-zeytin-500g',      NULL,    '500g',  'Salamura yeşil zeytin (kırık ya da bütün).',ARRAY['zeytin','olive','kahvaltı'],           v_admin_id),
  (c_kahvaltilik,'Zeytinyağı',         'zeytinyagi-500ml',        NULL,   '500ml', 'Soğuk sıkım sızma zeytinyağı.',             ARRAY['zeytinyağı','olive oil','yağ'],        v_admin_id),
  (c_kahvaltilik,'Bal',                'bal-500g',               NULL,    '500g',  'Doğal ham çiçek balı.',                     ARRAY['bal','honey','doğal','tatlandırıcı'],  v_admin_id),
  (c_kahvaltilik,'Reçel',              'recel-370g',             NULL,    '370g',  'Çilek, kayısı ya da vişne reçeli.',         ARRAY['reçel','jam','meyve','kahvaltı'],      v_admin_id),
  (c_kahvaltilik,'Tahin',              'tahin-350g',             NULL,    '350g',  'Susam ezmesi.',                             ARRAY['tahin','sesame','kahvaltı'],           v_admin_id),
  (c_kahvaltilik,'Pekmez',             'pekmez-700g',            NULL,    '700g',  'Üzüm ya da dut pekmezi.',                   ARRAY['pekmez','molasses','doğal','tatlı'],   v_admin_id),
  (c_kahvaltilik,'Nutella',            'nutella-400g',           'Nutella','400g', 'Fındıklı çikolatalı kahvaltı kreması.',      ARRAY['nutella','çikolata','fındık'],         v_admin_id),
  (c_kahvaltilik,'Fıstık Ezmesi',     'fistik-ezmesi-340g',     NULL,    '340g',  'Kremalı ya da parçalı fıstık ezmesi.',      ARRAY['fıstık ezmesi','peanut butter'],       v_admin_id),
  (c_kahvaltilik,'Ceviz İçi',         'ceviz-ici-200g',         NULL,    '200g',  'Taze ya da kuru ceviz içi.',                ARRAY['ceviz','walnut','kuruyemiş'],          v_admin_id),
  (c_kahvaltilik,'Susam',              'susam-150g',             NULL,    '150g',  'Kavrulmuş ya da çiğ susam tohumu.',         ARRAY['susam','sesame','tohum','kahvaltı'],   v_admin_id),
  (c_kahvaltilik,'Mısır Gevreği',     'misir-gevregi-500g',     NULL,    '500g',  'Şekerli ya da sade mısır gevreği.',         ARRAY['mısır gevreği','cereal','kahvaltı'],   v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 10. BAKLİYAT & TAHIL (15 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_bakliyat_tahil,'Pirinç',          'pirinc-1kg',             NULL,    '1kg',   'Baldo ya da uzun taneli pirinç.',           ARRAY['pirinç','rice','tahıl'],               v_admin_id),
  (c_bakliyat_tahil,'Makarna (Spagetti)','makarna-spagetti-500g',NULL,    '500g',  'Durum buğdayından spagetti.',               ARRAY['makarna','spaghetti','pasta'],         v_admin_id),
  (c_bakliyat_tahil,'Makarna (Penne)', 'makarna-penne-500g',     NULL,    '500g',  'Durum buğdayından penne makarna.',          ARRAY['makarna','penne','pasta'],             v_admin_id),
  (c_bakliyat_tahil,'Kırmızı Mercimek','kirmizi-mercimek-1kg',  NULL,    '1kg',   'Yemeklik kırmızı mercimek.',                ARRAY['mercimek','lentil','bakliyat'],        v_admin_id),
  (c_bakliyat_tahil,'Yeşil Mercimek', 'yesil-mercimek-1kg',     NULL,    '1kg',   'Yemeklik yeşil mercimek.',                  ARRAY['mercimek','lentil','bakliyat'],        v_admin_id),
  (c_bakliyat_tahil,'Nohut',          'nohut-1kg',              NULL,    '1kg',   'Kuru nohut.',                               ARRAY['nohut','chickpea','bakliyat'],         v_admin_id),
  (c_bakliyat_tahil,'Kuru Fasulye',   'kuru-fasulye-1kg',       NULL,    '1kg',   'Dermason ya da şeker fasulye.',             ARRAY['fasulye','bean','bakliyat'],           v_admin_id),
  (c_bakliyat_tahil,'Bulgur',         'bulgur-1kg',             NULL,    '1kg',   'Kaba ya da ince bulgur.',                   ARRAY['bulgur','tahıl','pilav'],              v_admin_id),
  (c_bakliyat_tahil,'Şeker',          'seker-1kg',              NULL,    '1kg',   'Rafine beyaz toz şeker.',                   ARRAY['şeker','sugar','tatlandırıcı'],        v_admin_id),
  (c_bakliyat_tahil,'Tuz',            'tuz-750g',               NULL,    '750g',  'İyotlu sofra tuzu.',                        ARRAY['tuz','salt','baharat'],                v_admin_id),
  (c_bakliyat_tahil,'Çeşni (Karabiber)','karabiber-50g',        NULL,    '50g',   'Öğütülmüş karabiber.',                     ARRAY['karabiber','pepper','baharat'],        v_admin_id),
  (c_bakliyat_tahil,'Kırmızı Pul Biber','kirmizi-pul-biber-50g',NULL,    '50g',   'Acı ya da tatlı pul biber.',                ARRAY['pul biber','kırmızı biber','baharat'], v_admin_id),
  (c_bakliyat_tahil,'Kimyon',         'kimyon-50g',             NULL,    '50g',   'Öğütülmüş ya da tane kimyon.',              ARRAY['kimyon','cumin','baharat'],            v_admin_id),
  (c_bakliyat_tahil,'Sirke',          'sirke-1l',               NULL,    '1L',    'Elma ya da üzüm sirkesi.',                  ARRAY['sirke','vinegar','soğuk'],             v_admin_id),
  (c_bakliyat_tahil,'Sıvı Yağ',      'sivi-yag-1l',            NULL,    '1L',    'Ayçiçeği ya da mısırözü yağı.',             ARRAY['sıvı yağ','yağ','ayçiçeği'],          v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 11. ATIŞTIRMALIK (8 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_atistirmalik,'Cips',             'cips-100g',              NULL,    '100g',  'Tuzlu ya da çeşitli aromalı patates cipsi.', ARRAY['cips','chips','atıştırmalık'],         v_admin_id),
  (c_atistirmalik,'Çikolata',         'cikolata-100g',          NULL,    '100g',  'Sütlü ya da bitter çikolata.',              ARRAY['çikolata','chocolate','tatlı'],        v_admin_id),
  (c_atistirmalik,'Gofret',           'gofret-30g',             NULL,    '30g',   'Çikolatalı ya da fındıklı gofret.',         ARRAY['gofret','wafer','tatlı'],              v_admin_id),
  (c_atistirmalik,'Leblebi',          'leblebi-200g',           NULL,    '200g',  'Kavrulmuş tuzlu ya da sade leblebi.',       ARRAY['leblebi','chickpea snack','kuruyemiş'],v_admin_id),
  (c_atistirmalik,'Fındık',           'findik-200g',            NULL,    '200g',  'İç fındık (kavrulmuş ya da çiğ).',         ARRAY['fındık','hazelnut','kuruyemiş'],       v_admin_id),
  (c_atistirmalik,'Mısır Patlaması',  'misir-patlamasi-100g',   NULL,    '100g',  'Tuzlu ya da tereyağlı patlamış mısır.',     ARRAY['patlamış mısır','popcorn','atıştırmalık'],v_admin_id),
  (c_atistirmalik,'Kuru Kayısı',      'kuru-kayisi-200g',       NULL,    '200g',  'Doğal kurutulmuş kayısı.',                  ARRAY['kayısı','apricot','kuru meyve'],       v_admin_id),
  (c_atistirmalik,'Kuru Üzüm',       'kuru-uzum-200g',         NULL,    '200g',  'Çekirdeksiz kurutulmuş üzüm.',              ARRAY['kuru üzüm','raisin','kuru meyve'],     v_admin_id),

  -- ════════════════════════════════════════════════════════════════════════════
  -- 12. SU & GAZLI (10 products)
  -- ════════════════════════════════════════════════════════════════════════════
  (c_su_gazli,'Damacana Su',          'damacana-su-19l',        NULL,    '19L',   'İçme suyu 19 litre damacana.',              ARRAY['su','water','damacana','içme'],        v_admin_id),
  (c_su_gazli,'Damacana Su (12L)',    'damacana-su-12l',        NULL,    '12L',   'İçme suyu 12 litre damacana.',              ARRAY['su','water','damacana','içme'],        v_admin_id),
  (c_su_gazli,'Şişe Su (1.5L)',      'sise-su-1-5l',           NULL,    '1.5L',  'Doğal kaynak ya da içme suyu.',             ARRAY['su','water','şişe'],                   v_admin_id),
  (c_su_gazli,'Şişe Su (0.5L)',      'sise-su-500ml',          NULL,    '500ml', 'Küçük boy şişe su.',                        ARRAY['su','water','şişe','küçük'],           v_admin_id),
  (c_su_gazli,'Koli Su (6x1.5L)',    'koli-su-6x1-5l',         NULL,    'koli',  '6 adet 1.5L şişe su kolisi.',              ARRAY['su','water','koli','toplu'],           v_admin_id),
  (c_su_gazli,'Koli Su (12x0.5L)',   'koli-su-12x500ml',       NULL,    'koli',  '12 adet 0.5L şişe su kolisi.',             ARRAY['su','water','koli','küçük'],           v_admin_id),
  (c_su_gazli,'Maden Suyu (1L)',     'maden-suyu-1l',          NULL,    '1L',    'Doğal ya da yapay gazlı maden suyu.',       ARRAY['maden suyu','sparkling','gazlı'],      v_admin_id),
  (c_su_gazli,'Maden Suyu Koli',     'maden-suyu-koli-6x1l',   NULL,    'koli',  '6 adet 1L maden suyu kolisi.',             ARRAY['maden suyu','koli','sparkling'],       v_admin_id),
  (c_su_gazli,'Soda (6''lı)',         'soda-6li',               NULL,    'koli',  '6 adet 200ml ya da 330ml soda kolisi.',    ARRAY['soda','gazlı','içecek'],               v_admin_id),
  (c_su_gazli,'Premium Damacana Su', 'premium-damacana-su-5l', NULL,    '5L',    '5 litre premium kaynak suyu.',              ARRAY['su','premium','5l','kaynak'],          v_admin_id)

  ON CONFLICT (slug) DO NOTHING;

  RAISE NOTICE 'seed_global_products: inserted (or skipped existing) 150 products. Admin: %', v_admin_id;

END $$;
