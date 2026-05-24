import { cn } from "@/lib/ui/cn";
import { Card } from "@/components/ui/Card";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  hideOnMobile?: boolean;
  cell: (row: T) => React.ReactNode;
}

/**
 * Desktop: HTML table. Mobile: stacked cards (no horizontal scroll tables).
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = "Kayıt bulunamadı.",
  mobileCard,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  mobileCard: (row: T) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <Card className="text-center text-sm text-text-muted">{emptyMessage}</Card>
    );
  }

  return (
    <>
      <div className="dashboard-mobile-stack space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id}>{mobileCard(row)}</div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl bg-brand-white shadow-sm ring-1 ring-border md:block">
        <table className="dashboard-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-app-bg/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted",
                    col.hideOnMobile && "hidden lg:table-cell",
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
                    className={cn(
                      "px-4 py-3 text-text-primary",
                      col.hideOnMobile && "hidden lg:table-cell",
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
