"use client";

import Link from "next/link";
import {
  AdaptiveDataView,
  type AdaptiveColumn,
} from "@/components/adaptive/AdaptiveDataView";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import type { OrderStatus } from "@/types/database";

export type AdminOrderRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  merchant: { name: string } | null;
};

export function AdminOrdersList({ orders }: { orders: AdminOrderRow[] }) {
  const columns: AdaptiveColumn<AdminOrderRow>[] = [
    {
      key: "id",
      header: "Sipariş",
      cell: (o) => (
        <span className="font-mono text-xs text-text-muted">
          #{o.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "merchant",
      header: "Market",
      cell: (o) => o.merchant?.name ?? "—",
    },
    {
      key: "status",
      header: "Durum",
      cell: (o) => <StatusChip status={o.status} />,
    },
    {
      key: "total",
      header: "Toplam",
      cell: (o) => `${(o.total_amount / 100).toFixed(2)} ₺`,
    },
    {
      key: "date",
      header: "Tarih",
      cell: (o) =>
        new Date(o.created_at).toLocaleString("tr-TR", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
  ];

  const card = (o: AdminOrderRow) => (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-brand-navy">
            {o.merchant?.name ?? "Market"}
          </p>
          <p className="text-xs text-text-muted">
            {new Date(o.created_at).toLocaleString("tr-TR")} ·{" "}
            {(o.total_amount / 100).toFixed(2)} ₺
          </p>
        </div>
        <StatusChip status={o.status} />
      </div>
    </Card>
  );

  return (
    <AdaptiveDataView
      columns={columns}
      rows={orders}
      mobileCard={card}
      emptyMessage="Sipariş bulunamadı."
    />
  );
}
