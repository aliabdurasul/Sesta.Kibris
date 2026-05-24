/**
 * Merchant dashboard layout.
 * Guards all /merchant/* routes — requires role=merchant.
 *
 * Safe paths:
 *   - No session → /auth/login (via requireRole)
 *   - Wrong role → correct dashboard (via requireRole)
 *   - No merchants row → setup guidance page (no crash)
 */
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layouts/AppShell";
import { MerchantOpenToggle } from "@/components/merchant/MerchantOpenToggle";
import { merchantNav } from "@/lib/ui/nav-config";
import { SignOutForm } from "@/components/auth/SignOutForm";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];

async function getMerchantData(
  userId: string,
): Promise<Pick<
  MerchantRow,
  "id" | "name" | "slug" | "is_open" | "is_active"
> | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, slug, is_open, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    log.error("merchant.layout.fetch", { userId, reason: error.message });
  }

  return (data as Pick<
    MerchantRow,
    "id" | "name" | "slug" | "is_open" | "is_active"
  > | null);
}

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("merchant");
  const merchant = await getMerchantData(session.id);

  // ── No merchant row → show setup guidance instead of crashing ────────────
  if (!merchant) {
    log.warn("merchant.layout.no_row", { userId: session.id });
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 text-4xl">🏪</div>
          <h1 className="text-xl font-bold text-gray-900">
            Market Kaydınız Bulunamadı
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Hesabınız aktif, ancak market kaydı henüz oluşturulmamış. Lütfen
            yöneticinizle iletişime geçin.
          </p>
          <p className="mt-1 text-xs text-gray-400">{session.email}</p>
          <div className="mt-6 space-y-3">
            <SignOutForm
              buttonClassName="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
            />
          </div>
        </div>
      </div>
    );
  }

  log.info("merchant.layout.ok", { userId: session.id, merchantId: merchant.id });

  return (
    <AppShell
      context="operator"
      title={merchant.name}
      subtitle="Market Paneli"
      navItems={merchantNav(merchant.slug)}
      headerActions={
        <MerchantOpenToggle
          isOpen={merchant.is_open}
          isActive={merchant.is_active}
        />
      }
    >
      {children}
    </AppShell>
  );
}
