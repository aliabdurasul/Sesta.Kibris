/**
 * Admin category management — /admin/catalog/categories
 * Task 0.0.14
 */
import { adminListCategories, adminUpsertCategory } from "@/lib/catalog/admin-actions";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await adminListCategories();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kategoriler</h2>
          <p className="text-sm text-gray-400">{categories.length} kategori</p>
        </div>
        <a href="/admin/catalog" className="text-sm text-gray-400 hover:text-gray-600">
          ← Katalog
        </a>
      </div>

      <CategoryManager categories={categories} upsertAction={adminUpsertCategory} />
    </div>
  );
}
