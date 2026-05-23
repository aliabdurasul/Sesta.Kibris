"use client";
/**
 * MerchantCatalogBrowser - interactive UI for searching/filtering global catalog and attaching products.
 * Task 0.0.19
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { attachProductToInventory } from "@/lib/catalog/merchant-actions";
import type { GlobalProduct, ProductCategory } from "@/types/catalog";
import Link from "next/link";
import { sanitizeProductImageUrl } from "@/lib/validation/http-url";

interface Props {
  products: GlobalProduct[];
  categories: ProductCategory[];
  existingProductIds: Set<string>;
  searchParams: { q?: string; cat?: string; page: number };
  totalPages: number;
}

export function MerchantCatalogBrowser({ products, categories, existingProductIds, searchParams, totalPages }: Props) {
  const router = useRouter();
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick inline price input state for the "Ekle" popover
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const handleAttach = async (product: GlobalProduct) => {
    const priceKurus = Math.round(parseFloat(priceInput) * 100);
    if (isNaN(priceKurus) || priceKurus <= 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setAttachingId(product.id);

    const res = await attachProductToInventory({ productId: product.id, price: priceKurus });
    
    setAttachingId(null);
    if (res.success) {
      existingProductIds.add(product.id); // optimistic
      setActivePopover(null);
      setPriceInput("");
      setSuccessMsg(`"${product.name}" envanterinize eklendi. (Pasif olarak eklendi, aktifleştirmeyi unutmayın)`);
      router.refresh();
    } else {
      setError(res.error ?? "Ekleme başarısız.");
    }
  };

  return (
    <div>
      {/* Filters */}
      <form className="mb-5 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Ürün ara..."
          className="flex-1 min-w-[200px] rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <select
          name="cat"
          defaultValue={searchParams.cat ?? ""}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          Ara
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200 flex justify-between items-center">
          <span>{successMsg}</span>
          <Link href="/merchant/products" className="font-semibold underline">Envantere Git</Link>
        </div>
      )}

      {products.length === 0 ? (
         <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500 font-medium">Aradığınız ürün katalogda bulunamadı.</p>
            <div className="mt-6">
              <Link
                href="/merchant/products/suggest"
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Yeni Ürün Öner
              </Link>
            </div>
         </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const isAdded = existingProductIds.has(p.id);
            const isPop = activePopover === p.id;
            return (
              <div key={p.id} className={`flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 transition-colors ${isAdded ? 'ring-green-100 bg-green-50/30' : 'ring-gray-100 hover:ring-blue-100'}`}>
                <div className="flex gap-3 mb-3 items-start">
                  {sanitizeProductImageUrl(p.image_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sanitizeProductImageUrl(p.image_url)!} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-gray-100" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl">📦</div>
                  )}
                  <div className="min-w-0 flex-1 pt-1">
                    <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">{p.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs text-gray-500">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5">{p.unit}</span>
                      {p.brand && <span>{p.brand}</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-2 border-t border-gray-50">
                  {isAdded ? (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 text-sm font-semibold text-green-600">
                      <span>✓</span> Envanterinizde
                    </div>
                  ) : isPop ? (
                    <div className="flex gap-2">
                       <input 
                         type="number" step="0.01" min="0.01"
                         placeholder="Fiyat ₺"
                         value={priceInput}
                         onChange={e => setPriceInput(e.target.value)}
                         className="w-full min-w-0 rounded-lg border border-gray-200 px-2 text-sm focus:border-blue-400 focus:outline-none"
                         autoFocus
                       />
                       <button 
                         onClick={() => handleAttach(p)}
                         disabled={attachingId === p.id}
                         className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-blue-700"
                       >
                         {attachingId === p.id ? '...' : 'Ekle'}
                       </button>
                       <button onClick={() => setActivePopover(null)} className="shrink-0 text-gray-400 hover:text-gray-600 px-1">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setActivePopover(p.id); setPriceInput(""); }}
                      className="w-full rounded-lg bg-gray-50 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      + Envantere Ekle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>Sayfa {searchParams.page} / {totalPages}</span>
          <div className="flex gap-2">
            {searchParams.page > 1 && (
              <Link
                href={`?q=${searchParams.q ?? ""}&cat=${searchParams.cat ?? ""}&page=${searchParams.page - 1}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                ← Önceki
              </Link>
            )}
            {searchParams.page < totalPages && (
              <Link
                href={`?q=${searchParams.q ?? ""}&cat=${searchParams.cat ?? ""}&page=${searchParams.page + 1}`}
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
