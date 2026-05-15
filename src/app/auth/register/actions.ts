/**
 * Server Action: Register a new customer account.
 * Only customer self-registration is allowed.
 * Merchants and couriers are created by admin.
 */
"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

type ActionState = { error: string } | null;

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password || !fullName) {
    return { error: "Tüm alanlar zorunludur." };
  }

  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır." };
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Bu e-posta adresi zaten kayıtlı." };
    }
    return { error: "Kayıt başarısız. Lütfen tekrar deneyin." };
  }

  if (!data.user) {
    return { error: "Kayıt başarısız. Lütfen tekrar deneyin." };
  }

  redirect("/auth/login?registered=1");
}
