"use client";
/**
 * CategoryManager — admin UI for managing product categories.
 * Task 0.0.14
 */
import React, { useState } from "react";
import type { ProductCategory } from "@/types/catalog";

interface Props {
  categories: ProductCategory[];
  upsertAction: (input: {
    id?: string;
    name: string;
    slug: string;
    parent_id?: string | null;
    display_order?: number;
    is_active?: boolean;
    icon_url?: string | null;
  }) => Promise<{ success: boolean; error?: string; id?: string }>;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function CategoryManager({ categories: initial, upsertAction }: Props) {
  const [categories, setCategories] = useState(initial);
  const [editing, setEditing] = useState<Partial<ProductCategory> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topLevel = categories.filter((c) => !c.parent_id);
  const subCategories = categories.filter((c) => !!c.parent_id);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) { setError("İsim zorunlu."); return; }
    const slug = editing.slug || slugify(editing.name);
    setError(null);
    setSaving(true);

    const result = await upsertAction({
      id: editing.id,
      name: editing.name.trim(),
      slug,
      parent_id: editing.parent_id ?? null,
      display_order: editing.display_order ?? 0,
      is_active: editing.is_active ?? true,
      icon_url: editing.icon_url ?? null,
    });

    setSaving(false);
    if (result.success) {
      // Refresh categories list
      const updated = editing.id
        ? categories.map((c) => c.id === editing.id ? { ...c, ...editing, slug } : c)
        : [...categories, { ...editing, id: result.id!, slug } as ProductCategory];
      setCategories(updated);
      setEditing(null);
    } else {
      setError(result.error ?? "Kayıt başarısız.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add new button */}
      <button
        onClick={() => setEditing({ is_active: true, display_order: categories.length + 1 })}
        className="w-full rounded-2xl border-2 border-dashed border-blue-200 py-3 text-sm font-medium text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        + Yeni Kategori Ekle
      </button>

      {/* Edit form */}
      {editing && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blue-100">
          <h3 className="mb-4 font-semibold text-gray-900">
            {editing.id ? "Kategori Düzenle" : "Yeni Kategori"}
          </h3>
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="space-y-3">
            <input
              value={editing.name ?? ""}
              onChange={(e) => {
                const name = e.target.value;
                setEditing((v) => ({ ...v, name, slug: slugify(name) }));
              }}
              placeholder="Kategori adı *"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            />
            <input
              value={editing.slug ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, slug: e.target.value }))}
              placeholder="Slug (otomatik)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm focus:border-blue-400 focus:outline-none"
            />
            <select
              value={editing.parent_id ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, parent_id: e.target.value || null }))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">Üst kategori yok (Ana kategori)</option>
              {topLevel.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <input
                type="number"
                value={editing.display_order ?? 0}
                onChange={(e) => setEditing((v) => ({ ...v, display_order: Number(e.target.value) }))}
                placeholder="Sıra"
                className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                value={editing.icon_url ?? ""}
                onChange={(e) => setEditing((v) => ({ ...v, icon_url: e.target.value || null }))}
                placeholder="İkon URL (opsiyonel)"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.is_active ?? true}
                onChange={(e) => setEditing((v) => ({ ...v, is_active: e.target.checked }))}
                className="h-4 w-4 rounded"
              />
              <span className="text-gray-700">Aktif</span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-700"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              onClick={() => { setEditing(null); setError(null); }}
              className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Slug</th>
              <th className="px-4 py-3 text-center">Sıra</th>
              <th className="px-4 py-3 text-center">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {topLevel.map((c) => (
              <React.Fragment key={c.id}>
                <tr className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.icon_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.icon_url} alt="" className="h-6 w-6 rounded object-cover" />
                      )}
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 hidden sm:table-cell">{c.slug}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{c.display_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}>
                      {c.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(c)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Düzenle
                    </button>
                  </td>
                </tr>
                {/* Sub-categories */}
                {subCategories.filter((s) => s.parent_id === c.id).map((s) => (
                  <tr key={s.id} className="bg-gray-50/40 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-gray-400">↳</span>
                        <span className="text-gray-700 text-xs">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400 hidden sm:table-cell">{s.slug}</td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-500">{s.display_order}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                      }`}>
                        {s.is_active ? "A" : "P"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setEditing(s)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Düzenle
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
