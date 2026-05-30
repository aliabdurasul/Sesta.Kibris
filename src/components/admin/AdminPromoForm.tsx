"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PromoImageUpload } from "@/components/admin/PromoImageUpload";
import { isRejectedImagePayload } from "@/lib/validation/http-url";
import type { HomepagePromoFormData } from "@/types/promo";

interface MerchantOption {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  merchants: MerchantOption[];
  initialValues?: Partial<HomepagePromoFormData>;
  onSubmit: (data: HomepagePromoFormData) => Promise<{ success: boolean; error?: string }>;
  submitLabel?: string;
  cancelHref?: string;
}

export function AdminPromoForm({
  merchants,
  initialValues,
  onSubmit,
  submitLabel = "Kaydet",
  cancelHref = "/admin/promos",
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialValues?.subtitle ?? "");
  const [imageUrl, setImageUrl] = useState(initialValues?.image_url ?? "");
  const [marketId, setMarketId] = useState(initialValues?.market_id ?? "");
  const [ctaText, setCtaText] = useState(initialValues?.cta_text ?? "Keşfet");
  const [sortOrder, setSortOrder] = useState(
    String(initialValues?.sort_order ?? 0),
  );
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Başlık zorunlu.");
      return;
    }
    if (!marketId) {
      setError("Hedef market seçin.");
      return;
    }
    if (!imageUrl.trim()) {
      setError("Kampanya görseli zorunlu.");
      return;
    }
    if (isRejectedImagePayload(imageUrl)) {
      setError("Geçersiz görsel.");
      return;
    }

    setSaving(true);
    const result = await onSubmit({
      title: title.trim(),
      subtitle: subtitle.trim(),
      image_url: imageUrl.trim(),
      market_id: marketId,
      cta_text: ctaText.trim() || "Keşfet",
      sort_order: parseInt(sortOrder, 10) || 0,
      is_active: isActive,
    });

    if (result.success) {
      router.push(cancelHref);
      router.refresh();
    } else {
      setError(result.error ?? "Kayıt başarısız.");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Başlık *
        </label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. %20 indirim"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Alt başlık
        </label>
        <input
          className={inputClass}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Örn. Yerel marketlerde bugün"
        />
      </div>

      <PromoImageUpload value={imageUrl} onChange={setImageUrl} disabled={saving} />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Hedef market *
        </label>
        <select
          className={inputClass}
          value={marketId}
          onChange={(e) => setMarketId(e.target.value)}
          required
        >
          <option value="">Market seçin…</option>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.slug})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            CTA metni
          </label>
          <input
            className={inputClass}
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            placeholder="Keşfet"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Sıra (küçük = önce)
          </label>
          <input
            type="number"
            className={inputClass}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-gray-300"
        />
        Aktif (anasayfada göster)
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Kaydediliyor…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
