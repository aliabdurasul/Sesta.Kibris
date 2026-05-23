"use client";
/**
 * AdminProductForm — shared form for create and edit.
 * Task 0.0.11 / 0.0.12
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCategory } from "@/types/catalog";

interface Props {
  categories: ProductCategory[];
  initialValues?: {
    name?: string;
    unit?: string;
    brand?: string;
    description?: string;
    category_id?: string | null;
    tags?: string[];
    is_active?: boolean;
    image_url?: string | null;
  };
  onSubmit: (data: {
    name: string;
    unit: string;
    brand: string;
    description: string;
    category_id: string | null;
    tags: string[];
    is_active: boolean;
    image_url: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  submitLabel?: string;
  cancelHref?: string;
}

const COMMON_UNITS = [
  "adet", "koli", "kg", "g", "500g", "250g", "200g", "100g", "50g",
  "L", "1L", "2L", "500ml", "330ml", "250ml", "200ml", "19L", "12L",
  "demet", "paket", "çift", "rulo",
];

export function AdminProductForm({
  categories,
  initialValues,
  onSubmit,
  submitLabel = "Kaydet",
  cancelHref = "/admin/catalog",
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [unit, setUnit] = useState(initialValues?.unit ?? "adet");
  const [brand, setBrand] = useState(initialValues?.brand ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? "");
  const [tagsRaw, setTagsRaw] = useState((initialValues?.tags ?? []).join(", "));
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);
  const [imageUrl, setImageUrl] = useState(initialValues?.image_url ?? "");
  const [unitCustom, setUnitCustom] = useState(
    COMMON_UNITS.includes(initialValues?.unit ?? "adet") ? false : true,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Ürün adı zorunlu."); return; }
    if (!unit.trim()) { setError("Birim zorunlu."); return; }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    const result = await onSubmit({
      name: name.trim(),
      unit: unit.trim(),
      brand: brand.trim(),
      description: description.trim(),
      category_id: categoryId || null,
      tags,
      is_active: isActive,
      image_url: imageUrl.trim() || null,
    });

    if (result.success) {
      router.push(cancelHref);
      router.refresh();
    } else {
      setError(result.error ?? "Kayıt başarısız.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Ürün Adı *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="ör. Tam Yağlı Süt"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      {/* Unit */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Birim *</label>
        <div className="flex gap-2">
          {!unitCustom ? (
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          ) : (
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Özel birim (ör. 19L)"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            />
          )}
          <button
            type="button"
            onClick={() => setUnitCustom((v) => !v)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
          >
            {unitCustom ? "Liste" : "Özel"}
          </button>
        </div>
      </div>

      {/* Brand */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Marka</label>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="ör. Danone, Ülker (opsiyonel)"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="">Kategori seçin...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Açıklama</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Ürün hakkında kısa bilgi..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Etiketler</label>
        <input
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="süt, dairy, protein (virgülle ayırın)"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Görsel URL</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://... veya storage path"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          Görseli yükledikten sonra URL&apos;i buraya yapıştırın. Yükleme için:{" "}
          <span className="font-mono">product-images/{"{product-id}"}/main.webp</span>
        </p>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow transition-transform ${
              isActive ? "translate-x-6" : ""
            }`}
          />
        </button>
        <label className="text-sm text-gray-700">
          {isActive ? "Aktif — storefrontta görünür" : "Pasif — gizli"}
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : submitLabel}
        </button>
        <a
          href={cancelHref}
          className="flex-1 rounded-xl bg-gray-100 py-2.5 text-center text-sm font-semibold text-gray-600 hover:bg-gray-200"
        >
          İptal
        </a>
      </div>
    </form>
  );
}
