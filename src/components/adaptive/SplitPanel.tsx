import { cn } from "@/lib/ui/cn";

/**
 * Mobile: stacked. Desktop (lg+): list + detail side by side.
 */
export function SplitPanel({
  list,
  detail,
  className,
  listClassName,
  detailClassName,
}: {
  list: React.ReactNode;
  detail?: React.ReactNode;
  className?: string;
  listClassName?: string;
  detailClassName?: string;
}) {
  if (!detail) {
    return <div className={className}>{list}</div>;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6",
        className,
      )}
    >
      <div className={cn("min-w-0 lg:w-[40%] lg:shrink-0", listClassName)}>
        {list}
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 lg:sticky lg:top-24",
          detailClassName,
        )}
      >
        {detail}
      </div>
    </div>
  );
}
