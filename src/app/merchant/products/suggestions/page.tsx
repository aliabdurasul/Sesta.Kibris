/**
 * Merchant suggestion history - /merchant/products/suggestions
 * Task 0.0.22
 */
import { getSession } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProductSuggestion } from "@/types/catalog";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING:      "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED:     "bg-green-100 text-green-700",
  REJECTED:     "bg-red-100 text-red-700",
  DUPLICATE:    "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekleyen", UNDER_REVIEW: "İnceleniyor",
  APPROVED: "Onaylandı", REJECTED: "Reddedildi", DUPLICATE: "Kopya",
};

export default async function MerchantSuggestionsPage() {
  const session = await getSession();
  if (!session?.merchantId) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("product_suggestions")
    .select("*")
    .eq("merchant_id", session.merchantId)
    .order("created_at", { ascending: false });

  const suggestions = (data ?? []) as ProductSuggestion[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/merchant/products" className="text-sm text-gray-400 hover:text-gray-600">
            ← Envanterim
          </Link>
          <span className="text-gray-200">/</span>
          <h2 className="text-xl font-bold text-gray-900">Geçmiş Önerilerim</h2>
        </div>
        <Link
          href="/merchant/products/suggest"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Yeni Öneri
        </Link>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-gray-500 font-medium">Henüz ürün öneriniz bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                   <h3 className="font-bold text-gray-900">{s.name}</h3>
                   <div className="mt-1 flex gap-2 text-xs text-gray-500">
                     <span className="rounded bg-gray-100 px-1.5 py-0.5">{s.unit}</span>
                     {s.brand && <span>Marka: {s.brand}</span>}
                   </div>
                   <p className="mt-2 text-xs text-gray-400">
                     İletildi: {new Date(s.created_at).toLocaleDateString("tr-TR")}
                   </p>
                   {s.admin_notes && (
                     <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700 ring-1 ring-gray-200">
                        <span className="font-semibold text-gray-900 text-xs uppercase tracking-wider block mb-1">Yönetici Notu</span>
                        {s.admin_notes}
                     </div>
                   )}
                </div>
                <div className="shrink-0 text-right">
                   <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[s.status] ?? ""}`}>
                     {STATUS_LABELS[s.status] ?? s.status}
                   </span>
                   {s.status === "APPROVED" && (
                     <p className="mt-2 text-xs font-medium text-green-600">
                       ✓ Envanterinize eklendi
                     </p>
                   )}
                   {s.status === "DUPLICATE" && (
                      <p className="mt-2 text-xs text-gray-500 max-w-[150px]">
                        Benzer bir ürün bulunduğu için işleme alınmadı.
                      </p>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
