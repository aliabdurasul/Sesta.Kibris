/**
 * Login page — mobile-first, Turkish UI.
 * Uses Server Action; no client-side JS required.
 * After successful login, proxy.ts / Server Action handles role redirect.
 */
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Giriş Yap — SestaKıbrıs",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(getRoleHomePath(session.role));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">SestaKıbrıs</h1>
          <p className="mt-1 text-sm text-gray-500">Hesabınıza giriş yapın</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <LoginForm />
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
