"use server";

/**
 * Server Action: Sign in with email + password.
 *
 * Role resolution:
 *   1. Try app_metadata.role (JWT — instant, no DB hit)
 *   2. Fall back to DB lookup (customers / merchants / couriers tables)
 *   3. If still no role → redirect to /auth/role-recovery
 *
 * redirectTo:
 *   If the login form includes a hidden "redirectTo" field (set by the page
 *   from searchParams), and the destination is a safe internal path,
 *   the user is sent there after login instead of their default dashboard.
 *
 * NOTE: Bootstrap admin logic has been REMOVED.
 * Admin accounts are created via /setup-admin (first-run wizard).
 * Subsequent admins are managed via the admin panel.
 */
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { resolveUserRole, getRoleHomePath } from "@/lib/auth";
import { log } from "@/lib/logger";

type ActionState = { error: string } | null;

/** Validates that a redirectTo path is safe (internal, no open redirect). */
function isSafePath(path: string | null | undefined): path is string {
  if (!path) return false;
  // Must be a relative path starting with /
  // Reject // (protocol-relative) and non-path strings
  return path.startsWith("/") && !path.startsWith("//");
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const redirectTo = (formData.get("redirectTo") as string | null)?.trim();

  if (!email || !password) {
    return { error: "E-posta ve şifre zorunludur." };
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const userId = data.user.id;
  const meta = data.user.app_metadata as Record<string, string> | undefined;

  const resolved = await resolveUserRole(userId, meta);

  if (!resolved) {
    log.warn("login.no_role", { userId, email });
    redirect("/auth/role-recovery");
  }

  log.info("login.ok", { userId, role: resolved.role });

  // Use redirectTo if it is a safe internal path.
  // This honours ?redirectTo=/checkout from the checkout auth gate.
  if (isSafePath(redirectTo)) {
    redirect(redirectTo);
  }

  redirect(getRoleHomePath(resolved.role));
}
