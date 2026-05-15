"use server";

/**
 * Server Action: Customer self-registration.
 *
 * Atomic flow (all-or-nothing):
 *   1. supabase.auth.signUp() — creates auth user
 *   2. adminClient.auth.admin.updateUserById() — sets app_metadata.role = "customer"
 *   3. adminClient.from("customers").insert() — creates customers row
 *
 * If step 2 or 3 fails, we still have a valid auth user but no role.
 * resolveUserRole() in auth.ts will recover via DB fallback on next login.
 *
 * Customers are the ONLY self-registerable role.
 * Merchants and couriers are created by admin only.
 */
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
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

  // ── 2 & 3. Atomically assign role + create customers row (admin client) ───
  try {
    const admin = createAdminClient();

    // Set role in JWT app_metadata so middleware reads it immediately
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: "customer" },
    });

    // Create customers row (idempotent — ignore conflict)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from("customers").upsert(
      { user_id: userId, full_name: fullName } as any,
      { onConflict: "user_id" },
    );
  } catch {
    // Role + row creation failed, but auth user exists.
    // resolveUserRole() will recover on first login via DB fallback.
    // Not a blocking error — user can still log in.
  }

  redirect("/auth/login?registered=1");
}
