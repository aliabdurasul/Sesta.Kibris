"use client";
/**
 * MerchantInventoryClient - Client component for managing merchant's inventory.
 * Task 0.0.18 & 0.0.20
 */
import { useState } from "react";
import Link from "next/link";
import {
  updateInventoryPrice,
  updateInventoryStock,
  toggleInventoryAvailability,
  detachFromInventory,
} from "@/lib/catalog/merchant-actions";
import type { InventoryItemWithProduct } from "@/types/catalog";

interface Props {
  initialInventory: InventoryItemWithProduct[];
  merchantId: string;
}

export function MerchantInventoryClient({ initialInventory }: Props) {
  const [inventory, setInventory] = useState(initialInventory);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  const handleToggle = async (item: InventoryItemWithProduct) => {
    setLoadingId(item.id);
    setError(null);
    const result = await toggleInventoryAvailability(item.id, !item.is_available);
    if (result.success) {
      setInventory((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i)),
      );
    } else {
      setError(result.error ?? "Güncelleme başarısız.");
    }
    setLoadingId(null);
  };

  const handleDetach = async (id: string) => {
    if (!confirm("Bu ürünü mağazanızdan kaldırmak istediğinize emin misiniz?")) return;
    setLoadingId(id);
    setError(null);
    const result = await detachFromInventory(id);
    if (result.success) {
      setInventory((prev) => prev.filter((i) => i.id !== id));
    } else {
      setError(result.error ?? "Kaldırma başarısız.");
    }
    setLoadingId(null);
  };

  const startEdit = (item: InventoryItemWithProduct) => {
    setEditingId(item.id);
    setEditPrice((item.price / 100).toString());
    setEditStock(item.stock_count?.toString() ?? "");
  };

  const saveEdit = async (item: InventoryItemWithProduct) => {
    setError(null);
    const priceKurus = Math.round(parseFloat(editPrice) * 100);
    if (isNaN(priceKurus) || priceKurus <= 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }
    const stockVal = editStock.trim() === "" ? null : parseInt(editStock, 10);
    if (stockVal !== null && (isNaN(stockVal) || stockVal < 0)) {
      setError("Geçerli bir stok girin veya boş bırakın.");
      return;
    }

    setLoadingId(item.id);
    // Optimistic UI update could go here, but for simplicity we await

    // Note: We run these sequentially for simplicity in UI error handling.
    // In a highly optimized scenario, these could be a single combined server action.
    let success = true;
    if (priceKurus !== item.price) {
      const res = await updateInventoryPrice(item.id, priceKurus);
      if (!res.success) { success = false; setError(res.error ?? "Fiyat güncellenemedi."); }
    }
    if (success && stockVal !== item.stock_count) {
      const res = await updateInventoryStock(item.id, stockVal);
      if (!res.success) { success = false; setError(res.error ?? "Stok güncellenemedi."); }
    }

    if (success) {
      setInventory((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, price: priceKurus, stock_count: stockVal } : i,
        ),
      );
      setEditingId(null);
    }
    setLoadingId(null);
  };

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <Link
          href="/merchant/products/browse"
          className="flex-1 rounded-2xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Katalogdan Ürün Ekle
        </Link>
        <Link
          href="/merchant/products/suggest"
          className="rounded-2xl border-2 border-dashed border-blue-200 px-6 py-3 text-center text-sm font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          Katalogda Yok Mu? Öner
        </Link>
      </div>

      <div className="space-y-3">
        {inventory.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Product Info */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
               {item.global_product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.global_product.image_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-gray-100"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
                    📦
                  </div>
                )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">
                  {item.global_product.name}
                </p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5">
                    {item.global_product.unit}
                  </span>
                  {item.global_product.brand && <span>{item.global_product.brand}</span>}
                </div>
              </div>
            </div>

            {/* Price/Stock & Actions */}
            <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
              {editingId === item.id ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right"
                    />
                    <span className="text-sm text-gray-500">₺</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Stok:</span>
                    <input
                      type="number"
                      placeholder="Sınırsız"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-right"
                    />
                  </div>
                  <div className="flex gap-1">
                     <button
                        onClick={() => saveEdit(item)}
                        disabled={loadingId === item.id}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                     >
                       Kaydet
                     </button>
                     <button
                        onClick={() => setEditingId(null)}
                        disabled={loadingId === item.id}
                        className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                     >
                       İptal
                     </button>
                  </div>
                </div>
              ) : (
                 <div className="flex items-center gap-4">
                    <div
                      className="cursor-pointer text-right group"
                      onClick={() => startEdit(item)}
                      title="Fiyat veya stok düzenlemek için tıklayın"
                    >
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {(item.price / 100).toFixed(2)} ₺
                      </p>
                      <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                         {item.stock_count === null ? "Sınırsız stok" : `Stok: ${item.stock_count}`}
                         <span className="ml-1 opacity-0 group-hover:opacity-100 inline-block transition-opacity">✎</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                        <button
                          onClick={() => handleToggle(item)}
                          disabled={loadingId === item.id || item.price <= 0}
                          title={item.price <= 0 ? "Fiyat 0'dan büyük olmalıdır" : undefined}
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            item.is_available
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {loadingId === item.id ? "..." : item.is_available ? "Aktif" : "Pasif"}
                        </button>
                        <button
                          onClick={() => handleDetach(item.id)}
                          disabled={loadingId === item.id}
                          className="rounded-full bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50"
                          title="Listeden Kaldır"
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {inventory.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p>Henüz envanterinizde ürün bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}
