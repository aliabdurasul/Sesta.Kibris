"use server";

/**
 * Server Action: Admin creates a new merchant.
 *
 * Flow:
 *   1. Create auth user (admin.auth.admin.createUser)
 *   2. Set app_metadata.role = "merchant"
 *   3. Create merchants row
 *   4. Link user_id → merchant
 *
 * Only callable by admin. No self-registration for merchants.
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
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";

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
      email_confirm: true, // skip email confirmation for admin-created accounts
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      user_id: userId,
      name,
      slug,
      phone: phone || null,
      is_active: true,
      is_open: true,
    } as any)
    .select("id")
    .maybeSingle();

  if (merchantError) {
    return { error: `İşletme oluşturulamadı: ${merchantError.message}` };
  }

  if (!merchantData) {
    return { error: "İşletme oluşturuldu ancak kayıt doğrulanamadı." };
  }

  const merchantId = (merchantData as { id: string }).id;

  // ── 3. Set app_metadata.role = "merchant" + merchant_id ──────────────────
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "merchant", merchant_id: merchantId },
  });

  redirect("/admin/actors?created=merchant");
}
