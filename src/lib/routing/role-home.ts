/**
 * Canonical dashboard URL per role — used by middleware and auth helpers.
 * Keep free of server-only imports (safe for Edge middleware).
 */

const HOMES = {
  merchant: "/merchant",
  courier: "/courier",
  admin: "/admin",
  customer: "/customer/orders",
} as const;

export type ActorRole = keyof typeof HOMES;

export function roleHome(role: ActorRole): string {
  return HOMES[role];
}

/** JWT role string → home path; unknown roles → role-recovery (never guess). */
export function roleHomeFromJwt(role: string | null): string {
  if (role === "merchant" || role === "courier" || role === "admin") {
    return HOMES[role];
  }
  if (role === "customer") {
    return HOMES.customer;
  }
  return "/auth/role-recovery";
}
