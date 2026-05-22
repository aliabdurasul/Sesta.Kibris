/**
 * /auth/role-recovery
 *
 * Safe landing page for authenticated users whose role cannot be determined.
 * This happens when:
 *   - app_metadata.role was never set by admin after signup
 *   - User exists in auth.users but has no row in customers/merchants/couriers
 *
 * Actions available:
 *   - Sign out and try again
 *   - Contact support
 *
 * This page intentionally does NOT auto-redirect to avoid loops.
 */
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Hesap Kurulumu — SestaKıbrıs",
};

export default async function RoleRecoveryPage() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900">
            Hesap Kurulumu Gerekiyor
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {session
              ? `"${session.email}" hesabınız sisteme kaydedilmiş ancak henüz bir role atanmamış.`
              : "Hesabınıza bir rol atanmamış."}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Bu durum genellikle hesap ilk oluşturulduğunda yaşanır. Yönetici
            hesabınızı etkinleştirene kadar bekleyebilir ya da destek
            ekibiyle iletişime geçebilirsiniz.
          </p>

          <div className="mt-6 space-y-3">
            {/* Sign out and go back to login */}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Çıkış Yap ve Tekrar Dene
              </button>
            </form>

            {/* Go to public storefront (no auth needed) */}
            <a
              href="/"
              className="block w-full rounded-xl bg-gray-100 py-3 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              Misafir Olarak Devam Et
            </a>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Destek:{" "}
            <a
              href="mailto:destek@sestakibris.com"
              className="text-blue-500 hover:underline"
            >
              destek@sestakibris.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
