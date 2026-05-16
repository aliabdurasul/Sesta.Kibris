"use server";

/**
 * Server Action: Admin creates a new courier.
 *
 * SECURITY: requireRole("admin") is called INSIDE the action.
 * UI protection alone is insufficient — Server Actions are directly invokable.
 *
 * Flow:
 *   1. Verify caller is admin
 *   2. Create auth user
 *   3. Create couriers row (merchant_id nullable — platform-level couriers)
 *   4. Set app_metadata.role = "courier" + courier_id
 *   5. Log the creation
 *
 * On failure after auth user creation → rollback (delete auth user).
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

export async function createCourierAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // ── SECURITY GATE ─────────────────────────────────────────────────────────
  const caller = await requireRole("admin");

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const vehicle = (formData.get("vehicle") as string | null)?.trim() ?? "";

  if (!email || !password || !fullName) {
    return { error: "E-posta, şifre ve ad soyad zorunludur." };
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

  // ── 2. Create couriers row ────────────────────────────────────────────────
  // merchant_id is nullable after migration 00016 — admin-created couriers
  // are platform-level and not tied to a specific merchant.
  const { data: courierData, error: courierError } = await admin
    .from("couriers")
    .insert({
      user_id: userId,
      full_name: fullName,
      phone: phone || null,
      vehicle_type: vehicle || null,
      is_active: true,
      is_available: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .maybeSingle();

  if (courierError || !courierData) {
    // Rollback: remove orphan auth user
    await admin.auth.admin.deleteUser(userId);
    log.error("admin.create_courier.rollback", {
      adminId: caller.id,
      email,
      reason: courierError?.message ?? "No courier row returned",
    });
    return {
      error: courierError
        ? `Kurye oluşturulamadı: ${courierError.message}`
        : "Kurye oluşturuldu ancak kayıt doğrulanamadı.",
    };
  }

  const courierId = (courierData as { id: string }).id;

  // ── 3. Set app_metadata ───────────────────────────────────────────────────
  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "courier", courier_id: courierId },
  });

  if (metaError) {
    log.warn("admin.create_courier.meta_failed", {
      adminId: caller.id,
      userId,
      courierId,
      reason: metaError.message,
    });
  }

  log.info("admin.create_courier.success", {
    adminId: caller.id,
    userId,
    courierId,
    email,
    fullName,
  });

  redirect("/admin/actors?created=courier");
}
