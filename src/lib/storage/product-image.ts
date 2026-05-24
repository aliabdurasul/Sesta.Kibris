/**
 * Product image storage — product-images bucket, public HTTPS URLs only in DB.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function extFromImageMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export function buildProductUploadPath(ext: string): string {
  const id = crypto.randomUUID();
  return `uploads/${id}.${ext}`;
}

export async function uploadProductImageToStorage(
  supabase: SupabaseClient<Database>,
  fileBytes: Buffer,
  contentType: string,
  objectPath?: string,
): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  const ext = extFromImageMime(contentType);
  const path = objectPath ?? buildProductUploadPath(ext);

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, fileBytes, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

  return { ok: true, url: data.publicUrl, path };
}
