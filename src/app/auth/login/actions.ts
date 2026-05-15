/**
 * Server Action: Sign in with email + password.
 * Supabase sets the session cookie server-side.
 * After sign-in, redirects to role-appropriate home.
 */
"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRoleHomePath, type UserRole } from "@/lib/auth";

type ActionState = { error: string } | null;

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "E-posta ve şifre zorunludur." };
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const role = (
    data.user.app_metadata as Record<string, string> | undefined
  )?.["role"] as UserRole | undefined;

  if (!role) {
    return {
      error:
        "Hesap rolü tanımlanmamış. Lütfen destek ekibiyle iletişime geçin.",
    };
  }

  redirect(getRoleHomePath(role));
}
