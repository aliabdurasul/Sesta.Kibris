"use server";

/**
 * Server Action: Sign in with email + password.
 *
 * Role resolution:
 *   1. Try app_metadata.role (JWT — instant)
 *   2. Check BOOTSTRAP_ADMIN_EMAIL env var — if match, elevate to admin once
 *   3. Fall back to DB lookup (customers / merchants / couriers tables)
 *   4. If still no role → redirect to /auth/role-recovery (never hard-error)
 *
 * Bootstrap admin: set BOOTSTRAP_ADMIN_EMAIL in env to the email of the first
 * admin account. On first login that email will automatically be assigned
 * app_metadata.role = "admin". This is a one-time safe elevation.
 */
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { resolveUserRole, getRoleHomePath } from "@/lib/auth";
import type { Database } from "@/types/database";

type ActionState = { error: string } | null;

function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) return null;
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

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

  // ── Bootstrap admin elevation ────────────────────────────────────────────
  // If this email matches BOOTSTRAP_ADMIN_EMAIL and has no role yet, elevate.
  const bootstrapEmail = process.env["BOOTSTRAP_ADMIN_EMAIL"]?.trim();
  if (bootstrapEmail && email.toLowerCase() === bootstrapEmail.toLowerCase()) {
    const existingRole = meta?.["role"];
    if (!existingRole || existingRole === "") {
      const admin = createAdminClient();
      if (admin) {
        await admin.auth.admin.updateUserById(userId, {
          app_metadata: { role: "admin" },
        });
        // Redirect directly — no need for resolveUserRole
        redirect("/admin");
      }
    }
  }

  // ── Normal role resolution ────────────────────────────────────────────────
  const resolved = await resolveUserRole(userId, meta);

  if (!resolved) {
    redirect("/auth/role-recovery");
  }

  redirect(getRoleHomePath(resolved.role));
}
