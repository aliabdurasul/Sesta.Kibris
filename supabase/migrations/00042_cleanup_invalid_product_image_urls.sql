-- Migration: 00042_cleanup_invalid_product_image_urls
-- Removes base64/data-URI garbage saved into image_url by mistake.

UPDATE global_products
SET image_url = NULL,
    updated_at = now()
WHERE image_url IS NOT NULL
  AND (
    image_url LIKE 'data:%'
    OR image_url LIKE '%data:image%'
    OR image_url LIKE '%;base64,%'
  );

COMMENT ON COLUMN global_products.image_url IS
  'Public https URL or Supabase storage path (product-images/...). Never data: URIs.';
