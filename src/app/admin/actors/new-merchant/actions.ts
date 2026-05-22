"use server";

/**
 * Server Action: Admin creates a new merchant.
 *
 * SECURITY: requireRole("admin") inside the action.
 *
 * Required DB columns (NOT NULL in Phase 1 schema): name, slug, category,
 * address, phone — validated before any insert; rollback auth user if merchant insert fails.
 */
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth";
import { log } from "@/lib/logger";
import {
  slugifyMarketName,
  resolveUniqueSlug,
} from "@/lib/market/slug";
import type { Database } from "@/types/database";

type ActionState = { error: string } | null;

function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createMerchantAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const caller = await requireRole("admin");

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const address = (formData.get("address") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const category =
    (formData.get("category") as string | null)?.trim() ?? "grocery";

  if (!email || !password || !name) {
    return { error: "E-posta, şifre ve işletme adı zorunludur." };
  }
  if (!address) {
    return { error: "Adres zorunludur." };
  }
  if (!phone) {
    return { error: "Telefon zorunludur." };
  }
  if (!["grocery", "water", "gas"].includes(category)) {
    return { error: "Geçersiz kategori." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır." };
  }

  const admin = createAdminClient();

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
  const slug = await resolveUniqueSlug(admin, slugifyMarketName(name));

  const { data: merchantData, error: merchantError } = await admin
    .from("merchants")
    .insert({
      user_id: userId,
      owner_user_id: userId,
      name,
      slug,
      category,
      address,
      phone,
      is_active: true,
      is_open: true,
      delivery_mode: "MERCHANT_DELIVERY",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .maybeSingle();

  if (merchantError || !merchantData) {
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

  await admin.from("user_roles").upsert(
    { user_id: userId, role: "merchant" } as never,
    { onConflict: "user_id,role" },
  );

  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "merchant", merchant_id: merchantId },
  });

  if (metaError) {
    await admin.from("merchants").delete().eq("id", merchantId);
    await admin.auth.admin.deleteUser(userId);
    log.error("admin.create_merchant.rollback_meta", {
      adminId: caller.id,
      userId,
      merchantId,
      reason: metaError.message,
    });
    return {
      error: `Kimlik güncellenemedi (işlem iptal): ${metaError.message}`,
    };
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
