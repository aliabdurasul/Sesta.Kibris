"use server";

/**
 * Server Action: Admin creates a new courier (atomic).
 *
 * 1. Create auth user
 * 2. Insert couriers row (merchant_id required)
 * 3. Set app_metadata { role, courier_id, merchant_id }
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
  const caller = await requireRole("admin");

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const vehicle = (formData.get("vehicle") as string | null)?.trim() ?? "";
  const merchantId = (formData.get("merchantId") as string | null)?.trim() ?? "";

  if (!email || !password || !fullName || !phone || !merchantId) {
    return {
      error:
        "E-posta, şifre, ad soyad, telefon ve bağlı işletme zorunludur.",
    };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır." };
  }

  const admin = createAdminClient();

  const { data: merchantRow, error: merchantLookupError } = await admin
    .from("merchants")
    .select("id")
    .eq("id", merchantId)
    .maybeSingle();

  if (merchantLookupError || !merchantRow) {
    return { error: "Seçilen işletme bulunamadı." };
  }

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

  const { data: courierData, error: courierError } = await admin
    .from("couriers")
    .insert({
      user_id: userId,
      merchant_id: merchantId,
      full_name: fullName,
      phone,
      vehicle_type: vehicle || null,
      is_active: true,
      is_available: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .single();

  if (courierError || !courierData) {
    await admin.auth.admin.deleteUser(userId);
    log.error("admin.create_courier.rollback", {
      adminId: caller.id,
      email,
      merchantId,
      reason: courierError?.message ?? "No courier row returned",
    });
    return {
      error: courierError
        ? `Kurye oluşturulamadı: ${courierError.message}`
        : "Kurye oluşturuldu ancak kayıt doğrulanamadı.",
    };
  }

  const courierId = (courierData as { id: string }).id;

  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      role: "courier",
      courier_id: courierId,
      merchant_id: merchantId,
    },
  });

  if (metaError) {
    await admin.from("couriers").delete().eq("id", courierId);
    await admin.auth.admin.deleteUser(userId);
    log.error("admin.create_courier.rollback_meta", {
      adminId: caller.id,
      email,
      reason: metaError.message,
    });
    return { error: "Rol atanamadı. İşlem geri alındı, lütfen tekrar deneyin." };
  }

  log.info("admin.create_courier.success", {
    adminId: caller.id,
    userId,
    courierId,
    merchantId,
    email,
    fullName,
  });

  redirect("/admin/actors?created=courier");
}
