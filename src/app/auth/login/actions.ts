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
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { resolveUserRole, getRoleHomePath, userMustChangePassword } from "@/lib/auth";
import {
  ACTIVE_ROLE_COOKIE,
  setActiveRoleCookie,
  clearSessionAuxCookies,
} from "@/lib/auth/session-cookies";
import { isAllowedPostLoginRedirect } from "@/lib/routing/safe-path";
import { log } from "@/lib/logger";
import { cookies } from "next/headers";

type ActionState = { error: string } | null;

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
  const cookieStore = await cookies();

  // Already signed in — skip duplicate signInWithPassword (prevents double POST)
  const { data: existingUserData } = await supabase.auth.getUser();
  const existingUser = existingUserData.user;
  if (existingUser) {
    const existingResolved = await resolveUserRole(
      existingUser.id,
      existingUser.app_metadata as Record<string, string> | undefined,
    );
    if (existingResolved) {
      setActiveRoleCookie((name, value, options) => {
        cookieStore.set(name, value, options);
      }, existingResolved.role);
      const home = getRoleHomePath(existingResolved.role);
      if (isAllowedPostLoginRedirect(redirectTo, home)) {
        redirect(redirectTo);
      }
      redirect(home);
    }
  }

  const previousRole = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const {
    data: { user: confirmedUser },
    error: confirmError,
  } = await supabase.auth.getUser();

  if (confirmError || !confirmedUser) {
    log.error("login.session_not_persisted", { email, reason: confirmError?.message });
    return { error: "Oturum oluşturulamadı. Lütfen tekrar deneyin." };
  }

  const authUser = confirmedUser;
  revalidatePath("/", "layout");

  if (userMustChangePassword(authUser)) {
    log.info("login.password_change_required", { userId: authUser.id });
    redirect("/auth/setup-password");
  }

  const userId = authUser.id;
  const meta = authUser.app_metadata as Record<string, string> | undefined;

  const resolved = await resolveUserRole(userId, meta);

  if (!resolved) {
    log.warn("login.no_role", { userId, email });
    redirect("/auth/role-recovery");
  }

  if (previousRole && previousRole !== resolved.role) {
    log.info("login.role_switch", {
      userId,
      from: previousRole,
      to: resolved.role,
    });
    await supabase.auth.signOut();
    clearSessionAuxCookies((name, value, options) => {
      cookieStore.set(name, value, options);
    });
    redirect("/auth/login?reason=role_switch");
  }

  setActiveRoleCookie((name, value, options) => {
    cookieStore.set(name, value, options);
  }, resolved.role);

  log.info("login.ok", { userId, role: resolved.role });

  // Use redirectTo if it is a safe internal path.
  // This honours ?redirectTo=/checkout from the checkout auth gate.
  const home = getRoleHomePath(resolved.role);
  if (isAllowedPostLoginRedirect(redirectTo, home)) {
    redirect(redirectTo);
  }

  redirect(home);
}
