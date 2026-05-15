/**
 * Courier dashboard layout.
 * Guards all /courier/* routes — requires role=courier.
 */
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { CourierNav } from "@/components/courier/CourierNav";

import type { Database } from "@/types/database";

type CourierRow = Database["public"]["Tables"]["couriers"]["Row"];

async function getCourierData(userId: string): Promise<Pick<CourierRow, "id" | "full_name" | "is_available"> | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("couriers")
    .select("id, full_name, is_available")
    .eq("user_id", userId)
    .single();
  return (data as Pick<CourierRow, "id" | "full_name" | "is_available"> | null);
}

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("courier");
  const courier = await getCourierData(session.id);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Kurye Paneli</p>
            <h1 className="font-bold text-gray-900">
              {courier?.full_name ?? session.email}
            </h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              courier?.is_available
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {courier?.is_available ? "Müsait" : "Meşgul"}
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <CourierNav />
    </div>
  );
}
