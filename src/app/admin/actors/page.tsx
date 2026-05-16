/**
 * /admin/actors
 * Lists all merchants and couriers. Links to create new ones.
 * Protected by admin role via AdminLayout.
 */
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
type CourierRow = Database["public"]["Tables"]["couriers"]["Row"];

async function getActors() {
  const supabase = await createServerClient();

  const [merchantsRes, couriersRes] = await Promise.all([
    supabase
      .from("merchants")
      .select("id, name, slug, is_active, is_open, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("couriers")
      .select(
        "id, full_name, phone, vehicle_type, is_active, is_available, merchant_id, created_at, merchants(name)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    merchants: (merchantsRes.data ?? []) as Pick<
      MerchantRow,
      "id" | "name" | "slug" | "is_active" | "is_open" | "created_at"
    >[],
    couriers: (couriersRes.data ?? []) as (Pick<
      CourierRow,
      | "id"
      | "full_name"
      | "phone"
      | "vehicle_type"
      | "is_active"
      | "is_available"
      | "merchant_id"
      | "created_at"
    > & { merchants: { name: string } | null })[],
    couriersError: couriersRes.error?.message ?? null,
    merchantsError: merchantsRes.error?.message ?? null,
  };
}

interface PageProps {
  searchParams: Promise<{ created?: string }>;
}

export default async function ActorsPage({ searchParams }: PageProps) {
  const { merchants, couriers, merchantsError, couriersError } =
    await getActors();
  const params = await searchParams;

  return (
    <div>
      {(merchantsError || couriersError) && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          Veri yüklenemedi. Migration 00017 (admin RLS) uygulandığından emin olun.
          {merchantsError && <span className="block">İşletmeler: {merchantsError}</span>}
          {couriersError && <span className="block">Kuryeler: {couriersError}</span>}
        </div>
      )}

      {params.created && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
          {params.created === "merchant"
            ? "İşletme hesabı başarıyla oluşturuldu."
            : "Kurye hesabı başarıyla oluşturuldu."}
        </div>
      )}

      {/* Merchants */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            İşletmeler ({merchants.length})
          </h2>
          <Link
            href="/admin/actors/new-merchant"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            + Yeni İşletme
          </Link>
        </div>

        {merchants.length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-sm text-gray-400 ring-1 ring-gray-100">
            Henüz işletme yok. İlk işletmeyi oluşturun.
          </p>
        ) : (
          <div className="space-y-2">
            {merchants.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">/{m.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.is_open
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {m.is_open ? "Açık" : "Kapalı"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.is_active
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {m.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Couriers */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Kuryeler ({couriers.length})
          </h2>
          <Link
            href="/admin/actors/new-courier"
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            + Yeni Kurye
          </Link>
        </div>

        {couriers.length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-sm text-gray-400 ring-1 ring-gray-100">
            Henüz kurye yok. İlk kuryeyi oluşturun.
          </p>
        ) : (
          <div className="space-y-2">
            {couriers.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {c.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {c.merchants?.name ?? "İşletme yok"} · {c.phone ?? "Telefon yok"}{" "}
                    · {c.vehicle_type ?? "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.is_available
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.is_available ? "Müsait" : "Meşgul"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
