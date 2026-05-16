/**
 * /auth/setup-password — set permanent password after bootstrap temp password
 * or after Supabase recovery / magic link (PKCE callback establishes session).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { userMustChangePassword } from "@/lib/auth/password-change";
import { getSession } from "@/lib/auth";
import { SetupPasswordClient } from "./SetupPasswordClient";

export const metadata = {
  title: "Şifre Belirle — SestaKıbrıs",
};

export default async function SetupPasswordPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !userMustChangePassword(user)) {
    const session = await getSession();
    if (session) {
      redirect(
        session.role === "admin"
          ? "/admin"
          : session.role === "merchant"
            ? "/merchant"
            : session.role === "courier"
              ? "/courier"
              : "/customer/orders",
      );
    }
    redirect("/auth/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">SestaKıbrıs</h1>
          <p className="mt-1 text-sm text-gray-500">Güvenli şifre</p>
        </div>
        <SetupPasswordClient />
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </main>
  );
}
