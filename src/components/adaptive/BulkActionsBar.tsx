"use client";

import { cn } from "@/lib/ui/cn";
import { useUiContext } from "@/components/layouts/UiProvider";

export function BulkActionsBar({
  selectedCount,
  children,
  className,
}: {
  selectedCount: number;
  children: React.ReactNode;
  className?: string;
}) {
  const { context } = useUiContext();

  if (context !== "operator" || selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-4 hidden items-center justify-between gap-4 rounded-xl bg-accent-soft px-4 py-3 ring-1 ring-accent/20 lg:flex",
        className,
      )}
    >
      <span className="text-sm font-medium text-accent-strong">
        {selectedCount} seçili
      </span>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
