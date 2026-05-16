/**
 * Path-based routing helpers for middleware and auth redirects.
 *
 * Protected dashboards use exact segment boundaries so `/merchants` (storefront)
 * is never treated as `/merchant` (dashboard).
 */
export type DashboardRole = "admin" | "merchant" | "courier" | "customer";

const PROTECTED_PREFIXES: ReadonlyArray<{ prefix: string; role: DashboardRole }> =
  [
  { prefix: "/admin", role: "admin" },
  { prefix: "/merchant", role: "merchant" },
  { prefix: "/courier", role: "courier" },
  { prefix: "/customer", role: "customer" },
];

const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/auth",
  "/merchants",
  "/checkout",
  "/staff",
  "/offline",
  "/setup-admin",
] as const;

/** Role → default dashboard (after login). */
export function roleHome(role: DashboardRole | string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "merchant":
      return "/merchant";
    case "courier":
      return "/courier";
    case "customer":
      return "/customer/orders";
    default:
      return "/auth/role-recovery";
  }
}

/**
 * Returns required role when pathname is inside a protected dashboard group.
 * Returns null for public routes (including storefront /merchants).
 */
export function getProtectedRoleForPath(pathname: string): DashboardRole | null {
  for (const { prefix, role } of PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}

/** Paths that never require auth or role-based redirects in middleware. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.includes(".")) return true;

  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
