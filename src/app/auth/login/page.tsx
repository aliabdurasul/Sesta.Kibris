/**
 * Login page — mobile-first, Turkish UI.
 * Uses Server Action; no client-side JS required.
 *
 * If user is already authenticated and has a resolved role → redirect to dashboard.
 * If user is authenticated but has no role → still show login page (allows re-login
 * with a different account, avoiding loop with role-recovery).
 */
import Link from "next/link";
import { getSession, getRoleHomePath } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Giriş Yap — SestaKıbrıs",
};

interface PageProps {
  searchParams: Promise<{ registered?: string; redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getSession();

  // Logged in with a valid role → go to dashboard
  if (session) {
    redirect(getRoleHomePath(session.role));
  }

  const params = await searchParams;
  const justRegistered = params.registered === "1";
  const redirectTo = params.redirectTo ?? "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">SestaKıbrıs</h1>
          <p className="mt-1 text-sm text-gray-500">Hesabınıza giriş yapın</p>
        </div>

        {justRegistered && (
          <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
            Kayıt başarılı! Hesabınız etkinleştirildikten sonra giriş yapabilirsiniz.
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Hesabınız yok mu?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-blue-600 underline-offset-4 hover:underline"
          >
            Kayıt olun
          </Link>
        </p>
      </div>
    </main>
  );
}
