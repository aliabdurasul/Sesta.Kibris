"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPromoForm } from "@/components/admin/AdminPromoForm";
import {
  adminGetPromo,
  adminListMerchantsForPromo,
  adminUpdatePromo,
} from "@/lib/promos/admin-actions";
import type { HomepagePromoWithMarket } from "@/types/promo";

export default function AdminPromoEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [merchants, setMerchants] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [promo, setPromo] = useState<HomepagePromoWithMarket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([adminListMerchantsForPromo(), adminGetPromo(id)]).then(
      ([m, p]) => {
        setMerchants(m);
        setPromo(p);
        setLoading(false);
      },
    );
  }, [id]);

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">Yükleniyor…</p>
    );
  }

  if (!promo) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-muted">Kampanya bulunamadı.</p>
        <Link
          href="/admin/promos"
          className="mt-2 inline-block text-sm text-accent-strong hover:underline"
        >
          ← Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/promos"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Kampanyalar
        </Link>
        <span className="text-gray-200">/</span>
        <h2 className="text-xl font-bold text-gray-900">Kampanyayı Düzenle</h2>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <AdminPromoForm
          merchants={merchants}
          initialValues={{
            title: promo.title,
            subtitle: promo.subtitle ?? "",
            image_url: promo.image_url,
            market_id: promo.market_id,
            cta_text: promo.cta_text,
            sort_order: promo.sort_order,
            is_active: promo.is_active,
          }}
          submitLabel="Değişiklikleri Kaydet"
          cancelHref="/admin/promos"
          onSubmit={(data) => adminUpdatePromo(id, data)}
        />
      </div>
    </div>
  );
}
