"use client";

import { Card } from "@/components/ui/Card";
import { useUiContext } from "@/components/layouts/UiProvider";
import { cn } from "@/lib/ui/cn";

export interface AdaptiveColumn<T> {
  key: string;
  header: string;
  className?: string;
  hideOnTablet?: boolean;
  cell: (row: T) => React.ReactNode;
}

/**
 * Mobile: cards. Tablet: 2-col card grid. Desktop: table (operator) or grid (consumer).
 */
export function AdaptiveDataView<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = "Kayıt bulunamadı.",
  mobileCard,
  tabletCard,
}: {
  columns: AdaptiveColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  mobileCard: (row: T) => React.ReactNode;
  tabletCard?: (row: T) => React.ReactNode;
}) {
  const { context } = useUiContext();
  const tabletRender = tabletCard ?? mobileCard;

  if (rows.length === 0) {
    return (
      <Card className="text-center text-sm text-text-muted">{emptyMessage}</Card>
    );
  }

  const showTable = context === "operator";

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id}>{mobileCard(row)}</div>
        ))}
      </div>

      <div className="hidden grid-cols-2 gap-3 md:grid lg:hidden">
        {rows.map((row) => (
          <div key={row.id}>{tabletRender(row)}</div>
        ))}
      </div>

      {showTable ? (
        <div className="hidden overflow-hidden rounded-2xl bg-brand-white shadow-sm ring-1 ring-border lg:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-app-bg/80">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted",
                      col.className,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/80 last:border-0 hover:bg-accent-soft/40"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 text-text-primary", col.className)}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id}>{tabletRender(row)}</div>
          ))}
        </div>
      )}
    </>
  );
}
