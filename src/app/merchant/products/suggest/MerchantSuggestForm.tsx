"use client";
/**
 * MerchantSuggestForm - Form for merchants to suggest new global products.
 * Task 0.0.21
 */
import { useState } from "react";
import { submitProductSuggestion } from "@/lib/catalog/merchant-actions";
import Link from "next/link";

const COMMON_UNITS = [
  "adet", "koli", "kg", "g", "500g", "250g", "200g", "100g", "50g",
  "L", "1L", "2L", "500ml", "330ml", "250ml", "200ml", "19L", "12L",
  "demet", "paket", "çift", "rulo"
];

export function MerchantSuggestForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("adet");
  const [brand, setBrand] = useState("");
  const [categoryHint, setCategoryHint] = useState("");
  const [description, setDescription] = useState("");
  const [merchantNotes, setMerchantNotes] = useState("");
  const [unitCustom, setUnitCustom] = useState(false);

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">Öneriniz Alındı</h3>
        <p className="mb-6 text-gray-500">
          {isDuplicate 
            ? "Öneriniz mevcut bir ürüne çok benzediği için otomatik olarak 'Kopya' olarak işaretlendi. Admin yine de inceleyecektir."
            : "Ürün öneriniz başarıyla iletildi. Onaylandığında otomatik olarak envanterinize eklenecektir."}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setSuccess(false);
              setName(""); setBrand(""); setDescription(""); setCategoryHint(""); setMerchantNotes("");
            }}
            className="rounded-xl border border-gray-200 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            Yeni Öneri Ekle
          </button>
          <Link
            href="/merchant/products/suggestions"
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Önerilerimi Gör
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Ürün adı zorunlu."); return; }
    if (!unit.trim()) { setError("Birim zorunlu."); return; }

    setSaving(true);
    const result = await submitProductSuggestion({
      name, unit, brand, categoryHint, description, merchantNotes
    });
    setSaving(false);

    if (result.success) {
      setIsDuplicate(result.isDuplicate ?? false);
      setSuccess(true);
    } else {
      setError(result.error ?? "Gönderim başarısız.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Ürün Adı *</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)} required
          placeholder="Tam ve anlaşılır isim (ör. Pınar Tam Yağlı Süt)"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Birim *</label>
          <div className="flex gap-2">
            {!unitCustom ? (
              <select value={unit} onChange={(e) => setUnit(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                {COMMON_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ör. 19L"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
            )}
            <button type="button" onClick={() => setUnitCustom((v) => !v)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50">
              {unitCustom ? "Liste" : "Özel"}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Marka</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="ör. Pınar, Ülker"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
      </div>

      <div>
         <label className="mb-1 block text-sm font-medium text-gray-700">Hangi Kategoriye Uyar? (Opsiyonel)</label>
         <input value={categoryHint} onChange={(e) => setCategoryHint(e.target.value)} placeholder="ör. Süt Ürünleri, Atıştırmalık"
           className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kısa Açıklama (Opsiyonel)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Ürün detayı..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Admin'e Notunuz (Opsiyonel)</label>
        <textarea value={merchantNotes} onChange={(e) => setMerchantNotes(e.target.value)} rows={2} placeholder="Eklemek istediğiniz bir not var mı?"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
      </div>

      <div className="pt-2">
        <button type="submit" disabled={saving}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Gönderiliyor..." : "Öneriyi Gönder"}
        </button>
      </div>
    </form>
  );
}
