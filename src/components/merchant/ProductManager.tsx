"use client";

/**
 * Merchant product manager.
 * Toggle availability, add new product.
 *
 * INSERT path:
 *   AddProductForm → createProduct (Server Action) → DB
 *
 * WHY Server Action for inserts (not direct supabase client):
 *   products.unit is NOT NULL in the schema. The browser client insert was
 *   silently failing because unit was never included in the payload.
 *   The server action validates unit before every insert and resolves
 *   merchant_id from the authenticated session instead of trusting the prop.
 *
 * UPDATE path (toggle availability):
 *   Still uses RLS-scoped browser client — low risk, no NOT NULL columns touched.
 */
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { createProduct } from "@/app/merchant/products/actions";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

/** Units available for selection. Must match allowed values in the DB / business logic. */
const UNIT_OPTIONS = [
  { value: "piece", label: "Adet" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "gram", label: "Gram (g)" },
  { value: "liter", label: "Litre (L)" },
  { value: "box", label: "Kutu" },
  { value: "pack", label: "Paket" },
] as const;

const DEFAULT_UNIT = "piece";

interface Props {
  initialProducts: Partial<Product>[];
  merchantId: string;
}

export function ProductManager({ initialProducts, merchantId }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const supabase = createBrowserClient();

  const toggleAvailability = async (product: Partial<Product>) => {
    if (!product.id) return;
    setLoadingId(product.id);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("products")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);

    if (updateError) {
      setError("Güncelleme başarısız.");
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: !p.is_available } : p,
        ),
      );
    }
    setLoadingId(null);
  };

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error}
        </div>
      )}

      <button
        onClick={() => setShowAddForm((v) => !v)}
        className="mb-4 w-full rounded-2xl border-2 border-dashed border-blue-200 py-3 text-sm font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
      >
        + Yeni Ürün Ekle
      </button>

      {showAddForm && (
        <AddProductForm
          onAdded={(p) => {
            setProducts((prev) => [...prev, p]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">{product.name}</p>
              <div className="flex gap-3 text-xs text-gray-400">
                {product.category && <span>{product.category}</span>}
                <span>
                  {product.price !== undefined
                    ? `${(product.price / 100).toFixed(2)} ₺`
                    : "—"}
                </span>
                {product.unit && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5">
                    {product.unit}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => toggleAvailability(product)}
              disabled={loadingId === product.id}
              className={`ml-4 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                product.is_available
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {loadingId === product.id
                ? "..."
                : product.is_available
                  ? "Aktif"
                  : "Pasif"}
            </button>
          </div>
        ))}
      </div>

      {products.length === 0 && !showAddForm && (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p>Henüz ürün eklenmemiş.</p>
        </div>
      )}
    </div>
  );
}

// ─── Add Product Form ─────────────────────────────────────────────────────────
// merchantId prop removed — server action reads it from session.

interface AddProductFormProps {
  onAdded: (product: Partial<Product>) => void;
  onCancel: () => void;
}

function AddProductForm({ onAdded, onCancel }: AddProductFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<string>(DEFAULT_UNIT);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceKurus = Math.round(parseFloat(price) * 100);
    if (isNaN(priceKurus) || priceKurus <= 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }
    if (!name.trim()) {
      setError("Ürün adı zorunlu.");
      return;
    }
    // unit always has a value (controlled with default), but guard anyway
    if (!unit) {
      setError("Birim seçimi zorunludur.");
      return;
    }

    setSaving(true);
    try {
      const result = await createProduct({
        name: name.trim(),
        price: priceKurus,
        unit,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      });

      // Pass optimistic product back to parent for instant list update.
      // Unit shown immediately; server is the source of truth for id/timestamps.
      onAdded({
        id: result.id,
        name: name.trim(),
        price: priceKurus,
        unit,
        category: category.trim() || null,
        description: description.trim() || null,
        is_available: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ürün eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blue-100"
    >
      <h3 className="mb-4 font-semibold text-gray-900">Yeni Ürün</h3>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ürün adı *"
          required
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Fiyat (₺) *"
          required
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />

        {/* Unit — required, NOT NULL in DB. Always has a value via controlled state. */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Birim *
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Kategori (opsiyonel)"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Açıklama (opsiyonel)"
          rows={2}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
