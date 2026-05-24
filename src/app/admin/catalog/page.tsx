/**
 * Admin catalog product list — /admin/catalog
 * Task 0.0.10
 */
import { adminListProducts, adminListCategories } from "@/lib/catalog/admin-actions";
import { adminGetPendingSuggestionCount as getSuggCount } from "@/lib/catalog/suggestion-admin-actions";
import Link from "next/link";
import { AdminCatalogProducts } from "@/components/admin/AdminCatalogProducts";
import { FiltersBar } from "@/components/adaptive/FiltersBar";
import { PageHeader } from "@/components/adaptive/PageHeader";
import type { GlobalProduct, ProductCategory } from "@/types/catalog";

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

  const productRows = products.map((p: GlobalProduct) => ({
    ...p,
    categoryName: p.category_id ? catMap.get(p.category_id) ?? undefined : undefined,
  }));

  return (
    <div>
      <PageHeader
        title="Ürün Kataloğu"
        description={`${total} ürün`}
        actions={
          <>
            {pendingSuggestions > 0 && (
              <Link
                href="/admin/catalog/suggestions"
                className="flex items-center gap-1.5 rounded-xl bg-brand-orange-soft px-3 py-2 text-sm font-medium text-brand-orange ring-1 ring-brand-orange/20"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-xs text-white">
                  {pendingSuggestions}
                </span>
                Bekleyen öneri
              </Link>
            )}
            <Link
              href="/admin/catalog/new"
              className="rounded-xl bg-accent-strong px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
            >
              + Yeni Ürün
            </Link>
          </>
        }
      />

      <FiltersBar>
      <form className="flex flex-wrap gap-2" method="get">
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
      </FiltersBar>

      {products.length === 0 ? (
        <div className="py-16 text-center text-text-muted">
          <p className="mb-3 text-4xl">📦</p>
          <p>Ürün bulunamadı.</p>
          <Link
            href="/admin/catalog/new"
            className="mt-3 inline-block text-sm text-accent-strong hover:underline"
          >
            İlk ürünü ekle →
          </Link>
        </div>
      ) : (
        <AdminCatalogProducts products={productRows} />
      )}

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
