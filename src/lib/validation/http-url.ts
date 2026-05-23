/**
 * Image / link URL guards — prevents next/image crashes from storage keys or garbage strings.
 */

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

/** Product catalog images — http(s) only. */
export function sanitizeProductImageUrl(value?: string | null): string | null {
  return isValidHttpUrl(value) ? value!.trim() : null;
}

/** General next/image src — http(s) or public path. */
export function sanitizeImageSrc(value?: string | null): string | null {
  if (!isSafeNextImageSrc(value)) return null;
  return value!.trim();
}
