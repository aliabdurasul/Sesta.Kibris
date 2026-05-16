"use server";

/**
 * Server Action: Admin creates a new merchant (atomic).
 */
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

type ActionState = { error: string } | null;

const VALID_CATEGORIES = ["grocery", "water", "gas"] as const;

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
  const caller = await requireRole("admin");

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const address = (formData.get("address") as string | null)?.trim() ?? "";
  const category = (formData.get("category") as string | null)?.trim() ?? "";

  if (!email || !password || !name || !phone || !address || !category) {
    return {
      error:
        "E-posta, şifre, işletme adı, kategori, telefon ve adres zorunludur.",
    };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır." };
  }
  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return { error: "Geçersiz kategori seçimi." };
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
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const { data: merchantData, error: merchantError } = await admin
    .from("merchants")
    .insert({
      user_id: userId,
      owner_user_id: userId,
      name,
      slug,
      category,
      phone,
      address,
      is_active: false,
      is_open: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .single();

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

  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "merchant", merchant_id: merchantId },
  });

  if (metaError) {
    await admin.from("merchants").delete().eq("id", merchantId);
    await admin.auth.admin.deleteUser(userId);
    log.error("admin.create_merchant.rollback_meta", {
      adminId: caller.id,
      email,
      reason: metaError.message,
    });
    return { error: "Rol atanamadı. İşlem geri alındı, lütfen tekrar deneyin." };
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
