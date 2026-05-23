"use client";

/**
 * AdminProductFormWrapper — bridges server-rendered edit page with client form.
 * Task 0.0.12
 */
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { adminUpdateProduct } from "@/lib/catalog/admin-actions";
import type { GlobalProduct, ProductCategory } from "@/types/catalog";

interface Props {
  product: GlobalProduct;
  categories: ProductCategory[];
  productId: string;
}

export function AdminProductFormWrapper({ product, categories, productId }: Props) {
  return (
    <AdminProductForm
      categories={categories}
      initialValues={{
        name: product.name,
        unit: product.unit,
        brand: product.brand ?? "",
        description: product.description ?? "",
        category_id: product.category_id,
        tags: product.tags ?? [],
        is_active: product.is_active,
        image_url: product.image_url,
      }}
      submitLabel="Değişiklikleri Kaydet"
      cancelHref="/admin/catalog"
      onSubmit={async (data) => {
        return adminUpdateProduct(productId, data);
      }}
    />
  );
}
