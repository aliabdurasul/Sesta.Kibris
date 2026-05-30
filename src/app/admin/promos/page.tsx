/**
 * Admin homepage promos — /admin/promos
 */
import Link from "next/link";
import { PageHeader } from "@/components/adaptive/PageHeader";
import { AdminPromoList } from "@/components/admin/AdminPromoList";
import { adminListPromos } from "@/lib/promos/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminPromosPage() {
  const promos = await adminListPromos();

  return (
    <div>
      <PageHeader
        title="Anasayfa Kampanyaları"
        description={`${promos.length} kampanya`}
        actions={
          <Link
            href="/admin/promos/new"
            className="rounded-xl bg-accent-strong px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
          >
            + Yeni Kampanya
          </Link>
        }
      />

      {promos.length === 0 ? (
        <div className="py-16 text-center text-text-muted">
          <p className="mb-3 text-4xl">🎯</p>
          <p>Henüz kampanya yok.</p>
          <Link
            href="/admin/promos/new"
            className="mt-3 inline-block text-sm text-accent-strong hover:underline"
          >
            İlk kampanyayı ekle →
          </Link>
        </div>
      ) : (
        <AdminPromoList promos={promos} />
      )}
    </div>
  );
}
