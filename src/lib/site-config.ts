/**
 * Canonical public site origin for SEO, sitemaps, metadata, and JSON-LD.
 *
 * Prefer NEXT_PUBLIC_SITE_URL in all environments.
 * NEXT_PUBLIC_APP_URL is supported as a legacy alias.
 *
 * Production default (when unset on Vercel): https://www.sestakibris.com
 * Development default: http://localhost:3000
 */

export const PRODUCTION_SITE_URL = "https://www.sestakibris.com";

const NON_PRODUCTION_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
]);

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL === "1"
  );
}

function resolveSiteUrlRaw(): string {
  const fromEnv =
    process.env["NEXT_PUBLIC_SITE_URL"]?.trim() ||
    process.env["NEXT_PUBLIC_APP_URL"]?.trim();

  if (fromEnv) {
    const normalized = normalizeSiteUrl(fromEnv);
    // Prevent misconfigured Vercel env (localhost) from breaking Search Console.
    if (isProductionRuntime() && isNonProductionUrl(`${normalized}/`)) {
      console.warn(
        `[site-config] Ignoring non-production URL in production runtime: ${fromEnv}. ` +
          `Using ${PRODUCTION_SITE_URL}. Set NEXT_PUBLIC_SITE_URL on Vercel.`,
      );
      return PRODUCTION_SITE_URL;
    }
    return normalized;
  }

  return isProductionRuntime() ? PRODUCTION_SITE_URL : "http://localhost:3000";
}

/** Strip trailing slash; never return empty. */
export function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return PRODUCTION_SITE_URL;
  return trimmed;
}

/** Canonical public origin (no trailing slash). Safe for sitemap + metadata. */
export function getSiteUrl(): string {
  return normalizeSiteUrl(resolveSiteUrlRaw());
}

/** Eager binding for metadataBase and static config. */
export const SITE_URL = getSiteUrl();

/** Build absolute URL: `buildAbsoluteUrl("/catalog")` → `https://www.sestakibris.com/catalog` */
export function buildAbsoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${path}`;
}

/** Resolve relative paths and storage keys to absolute https URLs for OG / JSON-LD. */
export function toAbsoluteMediaUrl(src: string | null | undefined): string {
  if (!src?.trim()) return "";
  const v = src.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return `${getSiteUrl()}${v}`;
  return v;
}

export function isNonProductionUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return NON_PRODUCTION_HOSTS.has(host) || host.endsWith(".local");
  } catch {
    return true;
  }
}

/**
 * Fail closed on Vercel production if sitemap/metadata would emit localhost.
 * Logs a warning in non-production builds.
 */
export function assertProductionSafeUrls(
  urls: string[],
  context: string,
): void {
  const offenders = urls.filter(isNonProductionUrl);
  if (offenders.length === 0) return;

  const sample = offenders.slice(0, 5).join(", ");
  const message =
    `[site-config] ${context}: non-production URL(s) detected (${offenders.length}): ${sample}. ` +
    `Set NEXT_PUBLIC_SITE_URL=${PRODUCTION_SITE_URL} on Vercel.`;

  if (isProductionRuntime()) {
    throw new Error(message);
  }
  console.warn(message);
}

/** Call at sitemap generation to block localhost leaking to Search Console. */
export function assertSitemapEntryUrls(entries: { url: string }[]): void {
  assertProductionSafeUrls(
    entries.map((e) => e.url),
    "sitemap",
  );
}
