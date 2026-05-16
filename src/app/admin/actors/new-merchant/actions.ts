"use server";

/**
 * Server Action: Admin creates a new merchant.
 *
 * SECURITY: requireRole("admin") is called INSIDE the action.
 * UI route protection (admin layout) is a second layer, not the primary guard.
 * Any direct Server Action invocation without a valid admin JWT is rejected.
 *
 * Flow:
 *   1. Verify caller is admin (requireRole)
 *   2. Create auth user via admin API (email_confirm: true — admin bypasses email flow)
 *   3. Create merchants row (is_active: false — admin must activate after setup)
 *   4. Set app_metadata.role = "merchant" + merchant_id
 *   5. Log the creation
 *
 * On any failure after auth user creation:
 *   - Auth user is deleted to prevent orphan accounts
 *   - Error is returned to admin UI
 */
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

type ActionState = { error: string } | null;

function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createMerchantAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // ── SECURITY GATE ─────────────────────────────────────────────────────────
  // requireRole throws/redirects if caller is not admin.
  // This protects against direct Server Action invocations that bypass the UI.
  const caller = await requireRole("admin");

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const category = (formData.get("category") as string | null)?.trim() ?? "grocery";

  if (!email || !password || !name) {
    return { error: "E-posta, şifre ve işletme adı zorunludur." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır." };
  }

  const admin = createAdminClient();

  // ── 1. Create auth user ───────────────────────────────────────────────────
  const { data: userData, error: userError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (userError) {
    if (userError.message.toLowerCase().includes("already registered")) {
      return { error: "Bu e-posta adresi zaten kayıtlı." };
    }
    return { error: `Kullanıcı oluşturulamadı: ${userError.message}` };
  }

  const userId = userData.user.id;
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  // ── 2. Create merchants row ───────────────────────────────────────────────
  const { data: merchantData, error: merchantError } = await admin
    .from("merchants")
    .insert({
      user_id: userId,
      owner_user_id: userId,
      name,
      slug,
      category,
      phone: phone || null,
      is_active: false,  // Admin must explicitly activate after setup
      is_open: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .maybeSingle();

  if (merchantError || !merchantData) {
    // Rollback: delete the auth user to prevent orphan account
    await admin.auth.admin.deleteUser(userId);
    log.error("admin.create_merchant.rollback", {
      adminId: caller.id,
      email,
      reason: merchantError?.message ?? "No merchant row returned",
    });
    return {
      error: merchantError
        ? `İşletme oluşturulamadı: ${merchantError.message}`
        : "İşletme oluşturuldu ancak kayıt doğrulanamadı.",
    };
  }

  const merchantId = (merchantData as { id: string }).id;

  // ── 3. Set app_metadata ───────────────────────────────────────────────────
  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "merchant", merchant_id: merchantId },
  });

  if (metaError) {
    // Non-fatal: merchant can still log in via DB fallback role resolution
    log.warn("admin.create_merchant.meta_failed", {
      adminId: caller.id,
      userId,
      merchantId,
      reason: metaError.message,
    });
  }

  log.info("admin.create_merchant.success", {
    adminId: caller.id,
    userId,
    merchantId,
    email,
    name,
  });

  redirect("/admin/actors?created=merchant");
}
