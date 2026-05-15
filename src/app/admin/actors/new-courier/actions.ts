"use server";

/**
 * Server Action: Admin (or merchant) creates a new courier.
 *
 * Flow:
 *   1. Create auth user
 *   2. Set app_metadata.role = "courier"
 *   3. Create couriers row
 *
 * Callable by: admin or merchant.
 */
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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
  const { data: courierData, error: courierError } = await admin
    .from("couriers")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      user_id: userId,
      full_name: fullName,
      phone: phone || null,
      vehicle_type: vehicle || null,
      is_active: true,
      is_available: true,
    } as any)
    .select("id")
    .maybeSingle();

  if (courierError) {
    return { error: `Kurye oluşturulamadı: ${courierError.message}` };
  }

  if (!courierData) {
    return { error: "Kurye oluşturuldu ancak kayıt doğrulanamadı." };
  }

  const courierId = (courierData as { id: string }).id;

  // ── 3. Set app_metadata.role = "courier" + courier_id ────────────────────
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "courier", courier_id: courierId },
  });

  redirect("/admin/actors?created=courier");
}
