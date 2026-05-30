/**
 * Promo banner storage — promo-banners bucket, public HTTPS URLs in DB.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isValidHttpUrl } from "@/lib/validation/http-url";

export const PROMO_BANNERS_BUCKET = "promo-banners";

export const PROMO_BANNER_MAX_BYTES = 5 * 1024 * 1024;

export const PROMO_BANNER_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function extFromPromoMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function buildPromoUploadPath(ext: string): string {
  return `${crypto.randomUUID()}.${ext}`;
}

export async function uploadPromoBannerToStorage(
  supabase: SupabaseClient<Database>,
  fileBytes: Buffer,
  contentType: string,
  objectPath?: string,
): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  const ext = extFromPromoMime(contentType);
  const path = objectPath ?? buildPromoUploadPath(ext);

  const { error: uploadError } = await supabase.storage
    .from(PROMO_BANNERS_BUCKET)
    .upload(path, fileBytes, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(PROMO_BANNERS_BUCKET).getPublicUrl(path);

  return { ok: true, url: data.publicUrl, path };
}

/** Resolve stored promo image to https URL for display. */
export function resolvePromoImageUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();

  if (isValidHttpUrl(v)) return v;

  const base = process.env["NEXT_PUBLIC_SUPABASE_URL"]?.replace(/\/$/, "");
  if (!base) return null;

  if (v.startsWith(`${PROMO_BANNERS_BUCKET}/`)) {
    return `${base}/storage/v1/object/public/${v.replace(/^\/+/, "")}`;
  }

  if (!v.includes("://")) {
    const path = v.includes("/")
      ? v.replace(/^\/+/, "")
      : `${PROMO_BANNERS_BUCKET}/${v}`;
    return `${base}/storage/v1/object/public/${path}`;
  }

  return null;
}

export function normalizeStoredPromoImageUrl(
  value?: string | null,
): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (isValidHttpUrl(v)) return v;
  if (v.startsWith(`${PROMO_BANNERS_BUCKET}/`)) return v;
  if (!v.includes("://")) {
    return v.includes("/")
      ? v.startsWith(PROMO_BANNERS_BUCKET)
        ? v
        : `${PROMO_BANNERS_BUCKET}/${v.replace(/^\/+/, "")}`
      : `${PROMO_BANNERS_BUCKET}/${v}`;
  }
  return null;
}
