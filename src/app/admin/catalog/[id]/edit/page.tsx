/**
 * Admin edit product — /admin/catalog/[id]/edit
 * Task 0.0.12
 */
import { notFound } from "next/navigation";
import {
  adminGetProduct,
  adminListCategories,
  adminUpdateProduct,
  adminDeactivateProduct,
  getMerchantCountForProduct,
} from "@/lib/catalog/admin-actions";
import { AdminProductFormWrapper } from "./AdminProductFormWrapper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({ params }: PageProps) {
  const { id } = await params;

  const [product, categories, merchantCount] = await Promise.all([
    adminGetProduct(id),
    adminListCategories(),
    getMerchantCountForProduct(id),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a href="/admin/catalog" className="text-sm text-gray-400 hover:text-gray-600">
            ← Katalog
          </a>
          <span className="text-gray-200">/</span>
          <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="rounded-lg bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-100">
            {merchantCount} markette satılıyor
          </span>
          <span className={`rounded-lg px-3 py-1 ring-1 ${
            product.is_active
              ? "bg-green-50 text-green-700 ring-green-100"
              : "bg-gray-50 text-gray-500 ring-gray-100"
          }`}>
            {product.is_active ? "Aktif" : "Pasif"}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <AdminProductFormWrapper
              product={product}
              categories={categories}
              productId={id}
            />
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-semibold text-gray-900 text-sm">Ürün Bilgisi</h3>
            <dl className="space-y-2 text-xs text-gray-500">
              <div><dt className="font-medium text-gray-700">Slug</dt><dd className="font-mono mt-0.5">{product.slug}</dd></div>
              <div><dt className="font-medium text-gray-700">Oluşturma</dt><dd>{new Date(product.created_at).toLocaleDateString("tr-TR")}</dd></div>
              {product.approved_at && (
                <div><dt className="font-medium text-gray-700">Onaylanma</dt><dd>{new Date(product.approved_at).toLocaleDateString("tr-TR")}</dd></div>
              )}
              {product.from_suggestion_id && (
                <div><dt className="font-medium text-gray-700">Kaynak</dt><dd>Öneri → Onaylandı</dd></div>
              )}
            </dl>
          </div>

          {product.is_active && (
            <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-100">
              <h3 className="mb-2 font-semibold text-red-900 text-sm">Tehlikeli İşlem</h3>
              <p className="mb-3 text-xs text-red-600">
                Ürünü pasif yapmak storefrontta gizler. Mevcut sipariş geçmişi etkilenmez.
              </p>
              <form action={async () => {
                "use server";
                await adminDeactivateProduct(id);
              }}>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Pasif Yap
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
