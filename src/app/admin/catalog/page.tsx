/**
 * Admin catalog product list — /admin/catalog
 * Task 0.0.10
 */
import { adminListProducts, adminListCategories } from "@/lib/catalog/admin-actions";
import { adminGetPendingSuggestionCount as getSuggCount } from "@/lib/catalog/suggestion-admin-actions";
import Link from "next/link";
import type { GlobalProduct, ProductCategory } from "@/types/catalog";

/** Guard: only pass valid http/https URLs. Never throws. */
function safeImage(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; cat?: string; active?: string; page?: string }>;
}

export default async function AdminCatalogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.q ?? "";
  const categoryId = sp.cat ?? "";
  const isActive = sp.active === "0" ? false : sp.active === "1" ? true : undefined;
  const page = Number(sp.page ?? "1");

  const [{ products, total }, categories, pendingSuggestions] = await Promise.all([
    adminListProducts({ search, categoryId: categoryId || undefined, isActive, page }),
    adminListCategories(),
    getSuggCount(),
  ]);

  const totalPages = Math.ceil(total / 50);

  const catMap = new Map<string, string>(
    categories.map((c: ProductCategory) => [c.id, c.name]),
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ürün Kataloğu</h2>
          <p className="text-sm text-gray-400">{total} ürün</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingSuggestions > 0 && (
            <Link
              href="/admin/catalog/suggestions"
              className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                {pendingSuggestions}
              </span>
              Bekleyen öneri
            </Link>
          )}
          <Link
            href="/admin/catalog/new"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Yeni Ürün
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form className="mb-5 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={search}
          placeholder="Ürün ara..."
          className="flex-1 min-w-[180px] rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <select
          name="cat"
          defaultValue={categoryId}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c: ProductCategory) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          name="active"
          defaultValue={sp.active ?? ""}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="">Tümü</option>
          <option value="1">Aktif</option>
          <option value="0">Pasif</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          Filtrele
        </button>
      </form>

      {/* Product table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {products.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="mb-3 text-4xl">📦</p>
            <p>Ürün bulunamadı.</p>
            <Link href="/admin/catalog/new" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              İlk ürünü ekle →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Ürün</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Kategori</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Marka</th>
                <th className="px-4 py-3 text-left">Birim</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p: GlobalProduct) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {safeImage(p.image_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={safeImage(p.image_url)!}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover ring-1 ring-gray-100"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
                          📦
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.brand && (
                          <p className="text-xs text-gray-400">{p.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {p.category_id ? catMap.get(p.category_id) ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {p.brand ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/catalog/${p.id}/edit`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Sayfa {page} / {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?q=${search}&cat=${categoryId}&active=${sp.active ?? ""}&page=${page - 1}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                ← Önceki
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?q=${search}&cat=${categoryId}&active=${sp.active ?? ""}&page=${page + 1}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                Sonraki →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
