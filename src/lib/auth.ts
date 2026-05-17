/**
 * Auth utilities for server components, layouts, and Server Actions.
 * Centralizes session access, role resolution, and route protection.
 * NEVER import this in client components.
 *
 * Role resolution order:
 *   1. user.app_metadata.role  (JWT — fastest, set by admin)
 *   2. customers table          (fallback for users registered before role was set)
 *   3. merchants table
 *   4. couriers table
 *   5. null → redirect to /auth/role-recovery
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/routing/role-home";

const IS_DEV = process.env.NODE_ENV !== "production";

export type UserRole = "customer" | "merchant" | "courier" | "admin";

export { userMustChangePassword } from "@/lib/auth/password-change";
export type { ActorRole } from "@/lib/routing/role-home";
export { roleHome };

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  merchantId?: string;
  courierId?: string;
}

// ─── Role resolution ──────────────────────────────────────────────────────────

/**
 * Resolves the role for a given auth user ID.
 *
 * Checks app_metadata first (O(1), no DB hit).
 * Falls back to DB lookup when app_metadata.role is absent.
 * Returns null if the user has no role record anywhere.
 */
export async function resolveUserRole(
  userId: string,
  appMeta: Record<string, string> | undefined,
): Promise<{ role: UserRole; merchantId?: string; courierId?: string } | null> {
  // ── 1. Fast path: JWT metadata ───────────────────────────────────────────
  const metaRole = appMeta?.["role"] as UserRole | undefined;
  if (metaRole) {
    return {
      role: metaRole,
      merchantId: appMeta?.["merchant_id"],
      courierId: appMeta?.["courier_id"],
    };
  }

  // ── 2. Slow path: DB lookup ───────────────────────────────────────────────
  const supabase = await createServerClient();

  // Check customers
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (customer) {
    return { role: "customer" };
  }

  // Check merchants
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (merchant) {
    return {
      role: "merchant",
      merchantId: (merchant as { id: string }).id,
    };
  }

  // Check couriers
  const { data: courier } = await supabase
    .from("couriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (courier) {
    return {
      role: "courier",
      courierId: (courier as { id: string }).id,
    };
  }

  // No role found anywhere
  return null;
}

// ─── Session helpers ──────────────────────────────────────────────────────────

/**
 * Returns the current authenticated user with resolved role.
 * Uses DB fallback if app_metadata.role is missing.
 * Returns null if no session OR no role can be determined.
 */
export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const meta = user.app_metadata as Record<string, string> | undefined;
  const resolved = await resolveUserRole(user.id, meta);

  if (!resolved) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    role: resolved.role,
    merchantId: resolved.merchantId,
    courierId: resolved.courierId,
  };
}

/**
 * Returns session or redirects to /auth/login.
 * Never crashes — always redirects safely.
 */
export async function requireSession(redirectTo?: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    const params = redirectTo
      ? `?redirectTo=${encodeURIComponent(redirectTo)}`
      : "";
    redirect(`/auth/login${params}`);
  }
  return session;
}

/**
 * Returns session only if role matches.
 * Redirects role mismatch to the correct dashboard.
 * Redirects no-role users to /auth/role-recovery (never loops).
 */
export async function requireRole(allowedRole: UserRole): Promise<SessionUser> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Read current pathname forwarded by middleware
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") ?? "unknown";

  // No session → login
  if (error || !user) {
    if (IS_DEV) {
      console.log(`[AUTH TRACE] requireRole(${allowedRole}) | path=${currentPath} | no user → /auth/login`);
    }
    redirect("/auth/login");
  }

  const meta = user.app_metadata as Record<string, string> | undefined;
  const jwtRole = meta?.["role"] as UserRole | undefined;
  const resolved = await resolveUserRole(user.id, meta);

  if (IS_DEV) {
    console.log(
      `[AUTH TRACE] requireRole(${allowedRole}) | path=${currentPath} | jwt=${jwtRole ?? "null"} | resolved=${resolved?.role ?? "null"}`,
    );
  }

  // Authenticated but no role anywhere → recovery page
  if (!resolved) {
    if (IS_DEV) {
      console.log(`[AUTH TRACE] requireRole(${allowedRole}) | path=${currentPath} | no role → /auth/role-recovery`);
    }
    redirect("/auth/role-recovery");
  }

  // ── Stale JWT refresh ────────────────────────────────────────────────────
  // Role came from DB fallback (JWT had no role). Refresh the session so
  // middleware gets correct app_metadata on subsequent requests.
  if (!jwtRole && resolved.role) {
    if (IS_DEV) {
      console.log(`[AUTH TRACE] requireRole(${allowedRole}) | path=${currentPath} | stale JWT → refreshSession()`);
    }
    try {
      await supabase.auth.refreshSession();
    } catch {
      // Non-fatal — middleware Guard 1 covers this
    }
  }

  // ── Same-subtree guard ─────────────────────────────────────────────────────
  // Role mismatch would normally redirect. But if the redirect target equals
  // the current path, we are already in a loop. Return the session to let the
  // layout render instead of redirecting to the same location.
  if (resolved.role !== allowedRole) {
    const target = getRoleHomePath(resolved.role);
    const alreadyThere =
      currentPath === target || currentPath.startsWith(target + "/");

    if (IS_DEV) {
      console.log(
        `[AUTH TRACE] requireRole(${allowedRole}) | path=${currentPath} | role mismatch: resolved=${resolved.role} | target=${target} | alreadyThere=${alreadyThere}`,
      );
    }

    if (alreadyThere) {
      // Return resolved session — don't redirect to where we already are.
      // The layout/page will render with correct session data.
      return {
        id: user.id,
        email: user.email ?? "",
        role: resolved.role,
        merchantId: resolved.merchantId,
        courierId: resolved.courierId,
      };
    }

    redirect(target);
  }

  return {
    id: user.id,
    email: user.email ?? "",
    role: resolved.role,
    merchantId: resolved.merchantId,
    courierId: resolved.courierId,
  };
}

/**
 * Role → home route mapping (alias for roleHome).
 */
export function getRoleHomePath(role: UserRole): string {
  return roleHome(role);
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ─── Safe context (never throws) ─────────────────────────────────────────────

export type SafeRole =
  | "anonymous"
  | "unassigned"
  | "customer"
  | "merchant"
  | "courier"
  | "admin";

export interface UserContext {
  userId: string | null;
  email: string | null;
  role: SafeRole;
  merchantId: string | null;
  courierId: string | null;
}

const ANONYMOUS_CONTEXT: UserContext = {
  userId: null,
  email: null,
  role: "anonymous",
  merchantId: null,
  courierId: null,
};

/**
 * Never throws. Returns structured context for layouts and pages.
 *
 * Returns:
 *   role="anonymous"  — no session
 *   role="unassigned" — session exists but no role anywhere in DB
 *   role=<role>       — resolved role with optional merchantId/courierId
 *
 * Use this as the primary session accessor.
 * Use requireRole() only when you need hard protection (layout guards).
 */
export async function safeGetUserContext(): Promise<UserContext> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return ANONYMOUS_CONTEXT;

    const meta = user.app_metadata as Record<string, string> | undefined;
    const resolved = await resolveUserRole(user.id, meta);

    if (!resolved) {
      return {
        userId: user.id,
        email: user.email ?? null,
        role: "unassigned",
        merchantId: null,
        courierId: null,
      };
    }

    return {
      userId: user.id,
      email: user.email ?? null,
      role: resolved.role as SafeRole,
      merchantId: resolved.merchantId ?? null,
      courierId: resolved.courierId ?? null,
    };
  } catch {
    // Never propagate auth errors — return anonymous
    return ANONYMOUS_CONTEXT;
  }
}
