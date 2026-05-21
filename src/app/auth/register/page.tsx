/**
 * Customer self-registration page.
 * Merchants and couriers are registered by admin only.
 *
 * Accepts ?redirectTo= so customers coming from /checkout are sent back
 * after registration → login, without losing their cart context.
 */
import Link from "next/link";
import { getSession, getRoleHomePath } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "./RegisterForm";

export const metadata = {
  title: "Kayıt Ol — SestaKıbrıs",
};

interface PageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (session) {
    redirect(getRoleHomePath(session.role));
  }

  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">SestaKıbrıs</h1>
          <p className="mt-1 text-sm font-medium text-gray-600">
            Kıbrıs&apos;ın Sepeti
          </p>
          <p className="mt-1 text-sm text-gray-500">Müşteri hesabı oluşturun</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <RegisterForm redirectTo={redirectTo} />
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Zaten hesabınız var mı?{" "}
          <Link
            href={redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login"}
            className="font-medium text-blue-600 underline-offset-4 hover:underline"
          >
            Giriş yapın
          </Link>
        </p>
      </div>
    </main>
  );
}
