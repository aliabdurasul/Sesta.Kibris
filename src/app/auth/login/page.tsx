/**
 * Login page — mobile-first, Turkish UI.
 * Uses Server Action; no client-side JS required.
 *
 * If user is already authenticated and has a resolved role → redirect to dashboard.
 * If user is authenticated but has no role → still show login page (allows re-login
 * with a different account, avoiding loop with role-recovery).
 */
import Link from "next/link";
import { headers } from "next/headers";
import { getSession, getRoleHomePath } from "@/lib/auth";
import { userMustChangePassword } from "@/lib/auth/password-change";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

const IS_DEV = process.env.NODE_ENV !== "production";

export const metadata = {
  title: "Giriş Yap — SestaKıbrıs",
};

interface PageProps {
  searchParams: Promise<{
    registered?: string;
    redirectTo?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && userMustChangePassword(user)) {
    redirect("/auth/setup-password");
  }

  const session = await getSession();

  // Logged in with a valid role → go to dashboard
  // Guard: only redirect if the target path is not already where the session
  // would send us. This prevents the login page from participating in a loop
  // where the redirect target is the same as the inbound path.
  if (session) {
    const target = getRoleHomePath(session.role);
    // Read the path that brought the user here (set by middleware)
    const headersList = await headers();
    const inboundPath = headersList.get("x-pathname") ?? "/auth/login";

    if (IS_DEV) {
      console.log(
        `[AUTH TRACE] LoginPage | inbound=${inboundPath} | session.role=${session.role} | target=${target}`,
      );
    }

    // Never redirect if we'd send the user back to where they came from
    if (!inboundPath.startsWith(target)) {
      redirect(target);
    }
  }

  const params = await searchParams;
  const justRegistered = params.registered === "1";
  const redirectTo = params.redirectTo ?? "";
  const callbackError = params.error === "callback";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">SestaKıbrıs</h1>
          <p className="mt-1 text-sm text-gray-500">Hesabınıza giriş yapın</p>
        </div>

        {callbackError && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
          >
            Oturum bağlantısı tamamlanamadı. Lütfen tekrar giriş yapın.
          </div>
        )}

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
