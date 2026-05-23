/**
 * Courier dashboard layout.
 * Guards all /courier/* routes — requires role=courier.
 *
 * Safe paths:
 *   - No session → /auth/login (via requireRole)
 *   - No couriers row → setup guidance page (no crash)
 */
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { CourierNav } from "@/components/courier/CourierNav";
import { SignOutForm } from "@/components/auth/SignOutForm";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

const IS_DEV = process.env.NODE_ENV !== "production";

type CourierRow = Database["public"]["Tables"]["couriers"]["Row"];

async function getCourierData(
  userId: string,
): Promise<Pick<CourierRow, "id" | "full_name" | "is_available"> | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("couriers")
    .select("id, full_name, is_available")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    log.error("courier.layout.fetch", { userId, reason: error.message });
  }

  return (data as Pick<
    CourierRow,
    "id" | "full_name" | "is_available"
  > | null);
}

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (IS_DEV) {
    console.log("[AUTH TRACE] CourierLayout | calling requireRole(courier)");
  }
  const session = await requireRole("courier");
  if (IS_DEV) {
    console.log(
      `[AUTH TRACE] CourierLayout | requireRole resolved | userId=${session.id} | role=${session.role}`,
    );
  }
  const courier = await getCourierData(session.id);

  // ── No courier row → show setup guidance instead of crashing ─────────────
  if (!courier) {
    log.warn("courier.layout.no_row", { userId: session.id });
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 text-4xl">🛵</div>
          <h1 className="text-xl font-bold text-gray-900">
            Kurye Kaydınız Bulunamadı
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Hesabınız aktif, ancak kurye kaydı henüz oluşturulmamış. Lütfen
            yöneticinizle iletişime geçin.
          </p>
          <p className="mt-1 text-xs text-gray-400">{session.email}</p>
          <div className="mt-6">
            <SignOutForm
              buttonClassName="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
            />
          </div>
        </div>
      </div>
    );
  }

  log.info("courier.layout.ok", { userId: session.id, courierId: courier.id });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Kurye Paneli</p>
            <h1 className="font-bold text-gray-900">
              {courier.full_name ?? session.email}
            </h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              courier.is_available
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {courier.is_available ? "Müsait" : "Meşgul"}
          </span>
        </div>
      </header>
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
      <CourierNav />
    </div>
  );
}
