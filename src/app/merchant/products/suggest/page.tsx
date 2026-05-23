/**
 * Merchant suggest product - /merchant/products/suggest
 * Task 0.0.21
 */
import Link from "next/link";
import { MerchantSuggestForm } from "./MerchantSuggestForm";

export const dynamic = "force-dynamic";

export default function MerchantSuggestPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/merchant/products" className="text-sm text-gray-400 hover:text-gray-600">
            ← Envanterim
          </Link>
          <span className="text-gray-200">/</span>
          <h2 className="text-xl font-bold text-gray-900">Yeni Ürün Öner</h2>
        </div>
        <Link href="/merchant/products/suggestions" className="text-sm font-medium text-blue-600 hover:underline">
          Geçmiş Önerilerim →
        </Link>
      </div>

      <div className="mb-6 rounded-2xl bg-blue-50 p-5 text-sm text-blue-800 ring-1 ring-blue-100">
        <p className="font-semibold mb-1">Katalogda aradığınız ürünü bulamadınız mı?</p>
        <p className="text-blue-700">
          Buradan yeni ürün önerebilirsiniz. Öneriniz sistem yöneticileri tarafından incelenecek ve onaylandığında otomatik olarak envanterinize eklenecektir. (Günlük limit: 5 öneri)
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <MerchantSuggestForm />
      </div>
    </div>
  );
}
