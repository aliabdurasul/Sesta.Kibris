/**
 * Admin suggestion review queue — /admin/catalog/suggestions
 * Tasks 0.0.15, 0.0.16, 0.0.17
 */
import { adminListSuggestions } from "@/lib/catalog/suggestion-admin-actions";
import { adminListCategories } from "@/lib/catalog/admin-actions";
import { SuggestionQueue } from "./SuggestionQueue";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminSuggestionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");

  const [{ suggestions, total }, categories] = await Promise.all([
    adminListSuggestions({ status: sp.status, page }),
    adminListCategories(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ürün Önerileri</h2>
          <p className="text-sm text-gray-400">{total} öneri</p>
        </div>
        <a href="/admin/catalog" className="text-sm text-gray-400 hover:text-gray-600">← Katalog</a>
      </div>

      {/* Status filter tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {[
          { label: "Tümü", value: "" },
          { label: "Bekleyen", value: "PENDING" },
          { label: "İnceleniyor", value: "UNDER_REVIEW" },
          { label: "Onaylandı", value: "APPROVED" },
          { label: "Reddedildi", value: "REJECTED" },
          { label: "Kopya", value: "DUPLICATE" },
        ].map((tab) => (
          <a
            key={tab.value}
            href={`?status=${tab.value}`}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              (sp.status ?? "") === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <SuggestionQueue suggestions={suggestions} categories={categories} />
    </div>
  );
}
