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
import { AppShell } from "@/components/layouts/AppShell";
import { SignOutForm } from "@/components/auth/SignOutForm";
import { courierNav } from "@/lib/ui/nav-config";
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
    <AppShell
      context="operator"
      title={courier.full_name ?? "Kurye"}
      subtitle="Kurye Paneli"
      navItems={courierNav()}
      headerActions={
        <>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              courier.is_available
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-app-bg text-text-muted ring-1 ring-border"
            }`}
          >
            {courier.is_available ? "Müsait" : "Meşgul"}
          </span>
          <SignOutForm buttonClassName="text-sm text-text-muted hover:text-brand-navy">
            Çıkış
          </SignOutForm>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
