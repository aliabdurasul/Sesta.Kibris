/**
 * Merchant dashboard layout.
 * Guards all /merchant/* routes — requires role=merchant.
 * Injects merchant context via server-side session.
 */
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { MerchantNav } from "@/components/merchant/MerchantNav";

import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];

async function getMerchantData(userId: string): Promise<Pick<MerchantRow, "id" | "name" | "is_open" | "is_active"> | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("merchants")
    .select("id, name, is_open, is_active")
    .eq("user_id", userId)
    .single();
  return (data as Pick<MerchantRow, "id" | "name" | "is_open" | "is_active"> | null);
}

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("merchant");
  const merchant = await getMerchantData(session.id);

  if (!merchant) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Restoran Paneli</p>
            <h1 className="font-bold text-gray-900">{merchant.name}</h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              merchant.is_open
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {merchant.is_open ? "Açık" : "Kapalı"}
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <MerchantNav />
    </div>
  );
}
