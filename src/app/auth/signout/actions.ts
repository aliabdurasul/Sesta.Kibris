"use server";

/**
 * Single shared sign-out entry point for all logout buttons and forms.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { clearAuthSession } from "@/lib/auth/signout";

export async function signOutAction(): Promise<void> {
  const supabase = await createServerClient();
  const cookieStore = await cookies();

  await clearAuthSession({
    signOut: () => supabase.auth.signOut(),
    setCookie: (name, value, options) => {
      cookieStore.set(name, value, options);
    },
  });

  redirect("/");
}
