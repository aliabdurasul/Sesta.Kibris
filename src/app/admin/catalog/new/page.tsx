"use client";

/**
 * Admin create product — /admin/catalog/new
 * Task 0.0.11
 */
import { adminCreateProduct } from "@/lib/catalog/admin-actions";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { adminListCategories } from "@/lib/catalog/admin-actions";
import { useState, useEffect } from "react";
import type { ProductCategory } from "@/types/catalog";
import Link from "next/link";

export default function AdminCatalogNewPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    adminListCategories().then(setCategories);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/catalog" className="text-sm text-gray-400 hover:text-gray-600">
          ← Katalog
        </Link>
        <span className="text-gray-200">/</span>
        <h2 className="text-xl font-bold text-gray-900">Yeni Ürün</h2>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <AdminProductForm
          categories={categories}
          submitLabel="Ürünü Oluştur"
          cancelHref="/admin/catalog"
          onSubmit={async (data) => {
            return adminCreateProduct(data);
          }}
        />
      </div>
    </div>
  );
}
