/** Routes that must work without Supabase auth (guest checkout + order API). */
export const GUEST_ALLOWED_PREFIXES = [
  "/checkout",
  "/cart",
  "/payment-init",
  "/api/orders",
  "/api/checkout",
  "/market",
  "/merchants",
  "/markets",
  "/auth",
  "/offline",
  "/setup-admin",
  "/",
] as const;

export function isGuestAllowedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.includes(".")) return true;
  return GUEST_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
