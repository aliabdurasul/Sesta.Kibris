/**
 * Image / link URL guards — prevents next/image crashes from storage keys or garbage strings.
 */

const PRODUCT_IMAGES_BUCKET = "product-images";

/** True only for absolute http(s) URLs. */
export function isValidHttpUrl(value?: string | null): boolean {
  if (!value?.trim()) return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** http(s) URL or site-root path (e.g. /images/markets/foo.jpg). Never a bare storage key. */
export function isSafeNextImageSrc(value?: string | null): boolean {
  if (!value?.trim()) return false;
  const v = value.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  return isValidHttpUrl(v);
}

function supabasePublicStorageUrl(objectPath: string): string | null {
  const base = process.env["NEXT_PUBLIC_SUPABASE_URL"]?.replace(/\/$/, "");
  if (!base) return null;
  const path = objectPath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${path}`;
}

/**
 * Product catalog image — full https URL or Supabase public storage path/key.
 * Bare storage keys (e.g. CAMSVhoyKh...) resolve to null.
 */
export function resolveProductImageUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();

  if (isValidHttpUrl(v)) return v;

  if (v.startsWith(`${PRODUCT_IMAGES_BUCKET}/`)) {
    return supabasePublicStorageUrl(v);
  }

  if (v.includes("/")) {
    return supabasePublicStorageUrl(`${PRODUCT_IMAGES_BUCKET}/${v}`);
  }

  return null;
}

/** @deprecated alias — use resolveProductImageUrl */
export function sanitizeProductImageUrl(value?: string | null): string | null {
  return resolveProductImageUrl(value);
}

/** General next/image src — http(s) or public path. */
export function sanitizeImageSrc(value?: string | null): string | null {
  if (!isSafeNextImageSrc(value)) return null;
  return value!.trim();
}
