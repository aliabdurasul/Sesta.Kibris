"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPromoForm } from "@/components/admin/AdminPromoForm";
import {
  adminCreatePromo,
  adminListMerchantsForPromo,
} from "@/lib/promos/admin-actions";

export default function AdminPromoNewPage() {
  const [merchants, setMerchants] = useState<
    { id: string; name: string; slug: string }[]
  >([]);

  useEffect(() => {
    adminListMerchantsForPromo().then(setMerchants);
  }, []);

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
        <h2 className="text-xl font-bold text-gray-900">Yeni Kampanya</h2>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <AdminPromoForm
          merchants={merchants}
          submitLabel="Kampanyayı Oluştur"
          cancelHref="/admin/promos"
          onSubmit={adminCreatePromo}
        />
      </div>
    </div>
  );
}
