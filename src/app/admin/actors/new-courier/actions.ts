"use server";

/**
 * Server Action: Admin creates a courier (atomic).
 *
 * Order: auth user → couriers row (with merchant_id) → app_metadata.
 * Any failure after auth creation rolls back prior steps (delete courier row + auth user).
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createCourierAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const caller = await requireRole("admin");

  const merchantId = (formData.get("merchantId") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const vehicle = (formData.get("vehicle") as string | null)?.trim() ?? "";

  if (!merchantId || !UUID_RE.test(merchantId)) {
    return { error: "Geçerli bir işletme seçin." };
  }
  if (!email || !password || !fullName) {
    return { error: "E-posta, şifre ve ad soyad zorunludur." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır." };
  }

  const admin = createAdminClient();

  const { data: merchantRow, error: merchantLookupErr } = await admin
    .from("merchants")
    .select("id")
    .eq("id", merchantId)
    .maybeSingle();

  if (merchantLookupErr || !merchantRow) {
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
      phone: phone || null,
      vehicle_type: vehicle || null,
      is_active: true,
      is_available: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .maybeSingle();

  if (courierError || !courierData) {
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

  await admin.from("user_roles").upsert(
    { user_id: userId, role: "courier" } as never,
    { onConflict: "user_id,role" },
  );

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
      courierId,
      reason: metaError.message,
    });
    return {
      error: `Kimlik güncellenemedi (işlem iptal): ${metaError.message}`,
    };
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
