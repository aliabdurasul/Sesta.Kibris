"use client";

import Link from "next/link";
import {
  AdaptiveDataView,
  type AdaptiveColumn,
} from "@/components/adaptive/AdaptiveDataView";
import { Card } from "@/components/ui/Card";
import { sanitizeProductImageUrl } from "@/lib/validation/http-url";
import type { GlobalProduct } from "@/types/catalog";

type Row = GlobalProduct & { categoryName?: string };

export function AdminCatalogProducts({ products }: { products: Row[] }) {
  const columns: AdaptiveColumn<Row>[] = [
    {
      key: "name",
      header: "Ürün",
      cell: (p) => (
        <div className="flex items-center gap-3">
          {sanitizeProductImageUrl(p.image_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sanitizeProductImageUrl(p.image_url)!}
              alt=""
              className="h-9 w-9 rounded-lg object-cover ring-1 ring-border"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-bg text-lg">
              📦
            </div>
          )}
          <div>
            <p className="font-medium text-brand-navy">{p.name}</p>
            {p.brand && <p className="text-xs text-text-muted">{p.brand}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Kategori",
      cell: (p) => (
        <span className="text-text-muted">{p.categoryName ?? "—"}</span>
      ),
    },
    {
      key: "unit",
      header: "Birim",
      cell: (p) => (
        <span className="rounded-md bg-app-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
          {p.unit}
        </span>
      ),
    },
    {
      key: "status",
      header: "Durum",
      cell: (p) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            p.is_active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-app-bg text-text-muted"
          }`}
        >
          {p.is_active ? "Aktif" : "Pasif"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "İşlem",
      className: "text-right",
      cell: (p) => (
        <Link
          href={`/admin/catalog/${p.id}/edit`}
          className="text-xs font-medium text-accent-strong hover:underline"
        >
          Düzenle
        </Link>
      ),
    },
  ];

  const card = (p: Row) => (
    <Card padding="sm" className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-brand-navy">{p.name}</p>
        <p className="text-xs text-text-muted">
          {p.categoryName ?? "—"} · {p.unit}
        </p>
      </div>
      <Link
        href={`/admin/catalog/${p.id}/edit`}
        className="shrink-0 text-xs font-medium text-accent-strong"
      >
        Düzenle
      </Link>
    </Card>
  );

  return (
    <AdaptiveDataView
      columns={columns}
      rows={products}
      mobileCard={card}
      emptyMessage="Ürün bulunamadı."
    />
  );
}
