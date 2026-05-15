/**
 * /staff — Operational actor login hub
 *
 * This page is the entry point for operational staff:
 *   - Merchant owners
 *   - Couriers
 *   - Admin
 *
 * It is intentionally separate from the customer-facing auth flow.
 * NOT linked in the public storefront navbar.
 *
 * Logged-in users are redirected to their dashboard immediately.
 */
import { safeGetUserContext, getRoleHomePath } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Personel Girişi — SestaKıbrıs",
};

export default async function StaffPage() {
  const ctx = await safeGetUserContext();

  // Already authenticated → go to their dashboard
  if (
    ctx.role === "merchant" ||
    ctx.role === "courier" ||
    ctx.role === "admin"
  ) {
    redirect(getRoleHomePath(ctx.role));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">SestaKıbrıs</h1>
          <p className="mt-1 text-sm text-gray-400">Operasyon Paneli</p>
        </div>

        <div className="space-y-3">
          {/* Merchant */}
          <Link
            href="/auth/login?redirectTo=/merchant"
            className="flex items-center gap-4 rounded-2xl bg-gray-800 p-4 transition-colors hover:bg-gray-700"
          >
            <span className="text-3xl">🏪</span>
            <div>
              <p className="font-semibold text-white">İşletme Girişi</p>
              <p className="text-xs text-gray-400">
              Market sahibi / müdür girişi
              </p>
            </div>
          </Link>

          {/* Courier */}
          <Link
            href="/auth/login?redirectTo=/courier"
            className="flex items-center gap-4 rounded-2xl bg-gray-800 p-4 transition-colors hover:bg-gray-700"
          >
            <span className="text-3xl">🛵</span>
            <div>
              <p className="font-semibold text-white">Kurye Girişi</p>
              <p className="text-xs text-gray-400">Teslimat kurye girişi</p>
            </div>
          </Link>

          {/* Admin */}
          <Link
            href="/auth/login?redirectTo=/admin"
            className="flex items-center gap-4 rounded-2xl bg-gray-800 p-4 transition-colors hover:bg-gray-700"
          >
            <span className="text-3xl">🔑</span>
            <div>
              <p className="font-semibold text-white">Yönetici Girişi</p>
              <p className="text-xs text-gray-400">
                Sistem yöneticisi girişi
              </p>
            </div>
          </Link>
        </div>

        {/* Separator */}
        <div className="mt-8 border-t border-gray-700 pt-6 text-center">
          <p className="text-xs text-gray-500">
            Müşteri misiniz?{" "}
            <Link
              href="/merchants"
              className="text-blue-400 hover:text-blue-300"
            >
              Alışverişe git →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
