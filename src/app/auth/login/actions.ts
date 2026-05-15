"use server";

/**
 * Server Action: Sign in with email + password.
 *
 * Role resolution:
 *   1. Try app_metadata.role (JWT — instant)
 *   2. Fall back to DB lookup (customers / merchants / couriers tables)
 *   3. If still no role → redirect to /auth/role-recovery (never hard-error)
 *
 * Never returns "Hesap rolü tanımlanmamış" — always resolves or recovers.
 */
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { resolveUserRole, getRoleHomePath } from "@/lib/auth";

type ActionState = { error: string } | null;

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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

  const meta = data.user.app_metadata as Record<string, string> | undefined;
  const resolved = await resolveUserRole(data.user.id, meta);

  // No role found in JWT or DB → go to recovery page, not an error
  if (!resolved) {
    redirect("/auth/role-recovery");
  }

  redirect(getRoleHomePath(resolved.role));
}
