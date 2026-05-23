/** Validates internal redirect paths (no open redirect). */
export function isSafeRedirectPath(
  path: string | null | undefined,
): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//");
}

/** Protected dashboard segments that may receive a post-login redirect. */
const PROTECTED_REDIRECT_PREFIXES = [
  "/merchant",
  "/courier",
  "/admin",
  "/customer",
  "/checkout",
] as const;

/**
 * Returns a pathname-only redirect target for protected routes and checkout.
 * Strips query/hash, blocks /auth/* and nested redirectTo values.
 */
export function sanitizeRedirectTo(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;

  let path = raw.trim();
  if (!path || path.includes("://")) return null;

  const queryIndex = path.indexOf("?");
  if (queryIndex >= 0) path = path.slice(0, queryIndex);
  const hashIndex = path.indexOf("#");
  if (hashIndex >= 0) path = path.slice(0, hashIndex);

  if (!isSafeRedirectPath(path)) return null;
  if (path.startsWith("/auth")) return null;
  if (path.includes("redirectTo=")) return null;

  const allowed = PROTECTED_REDIRECT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  return allowed ? path : null;
}

/** Login URL with at most one sanitized redirectTo param (no stacked query junk). */
export function buildLoginRedirectPath(
  pathname: string,
  extraParams?: Record<string, string>,
): string {
  const safe = sanitizeRedirectTo(pathname);
  const params = new URLSearchParams();
  if (safe) params.set("redirectTo", safe);
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `/auth/login?${qs}` : "/auth/login";
}

/** Whether a sanitized redirect matches the user's role home or checkout. */
export function isAllowedPostLoginRedirect(
  redirectTo: string | null | undefined,
  home: string,
): redirectTo is string {
  const safe = sanitizeRedirectTo(redirectTo);
  if (!safe) return false;
  return (
    safe === home ||
    safe.startsWith(`${home}/`) ||
    safe.startsWith("/checkout")
  );
}
