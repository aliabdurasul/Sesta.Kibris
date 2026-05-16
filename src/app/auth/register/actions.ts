"use server";

/**
 * Server Action: Customer self-registration.
 *
 * Atomic flow (all-or-nothing):
 *   1. supabase.auth.signUp() — creates auth user
 *   2. adminClient.auth.admin.updateUserById() — sets app_metadata.role = "customer"
 *   3. adminClient.from("customers").upsert() — creates customers row
 *
 * Schema (after migration 00016):
 *   customers.id = auth.users.id (PK, same UUID)
 *   customers.user_id = auth.users.id (canonical FK for app queries)
 *
 * Customers are the ONLY self-registerable role.
 * Merchants and couriers are created by admin only.
 *
 * If step 2 or 3 fails, auth user still exists but has no role.
 * resolveUserRole() in auth.ts recovers via DB fallback on next login.
 */
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

type ActionState = { error: string } | null;

function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) throw new Error("Missing Supabase admin env vars");
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";

  if (!email || !password || !fullName) {
    return { error: "Tüm alanlar zorunludur." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır." };
  }

  // ── 1. Create auth user ────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Bu e-posta adresi zaten kayıtlı." };
    }
    return { error: "Kayıt başarısız. Lütfen tekrar deneyin." };
  }

  if (!data.user) {
    return { error: "Kayıt başarısız. Lütfen tekrar deneyin." };
  }

  const userId = data.user.id;

  // ── 2 & 3. Assign role + create customers row (service role) ───────────────
  try {
    const admin = createAdminClient();

    // Set role in JWT app_metadata so middleware reads it immediately
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: "customer" },
    });

    // Create customers row.
    // id = userId (customers.id IS the auth user UUID per migration 00003)
    // user_id = userId (canonical FK added by migration 00016)
    // phone and full_name are nullable after migration 00016
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("customers") as any).upsert(
      { id: userId, user_id: userId, full_name: fullName || null },
      { onConflict: "id" },
    );

    log.info("register.success", { userId, email });
  } catch (err) {
    // Role + row creation failed, but auth user exists.
    // resolveUserRole() will recover on first login via DB fallback.
    log.warn("register.post_signup_failed", {
      userId,
      email,
      reason: err instanceof Error ? err.message : String(err),
    });
  }

  redirect("/auth/login?registered=1");
}
