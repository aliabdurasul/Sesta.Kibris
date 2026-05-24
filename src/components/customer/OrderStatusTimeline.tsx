"use client";

import { cn } from "@/lib/ui/cn";

/** Simplified customer-facing delivery timeline (visual-first). */
const STEPS = [
  { key: "pending", label: "Alındı" },
  { key: "confirmed", label: "Onaylandı" },
  { key: "preparing", label: "Hazırlanıyor" },
  { key: "on_the_way", label: "Yolda" },
  { key: "delivered", label: "Teslim" },
] as const;

const TERMINAL_BAD = ["REJECTED", "CANCELLED", "FAILED_DELIVERY"];

function stepIndexForStatus(status: string): number {
  if (TERMINAL_BAD.includes(status)) return -1;
  if (status === "PENDING") return 0;
  if (status === "CONFIRMED") return 1;
  if (status === "READY") return 2;
  if (["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(status)) return 3;
  if (status === "DELIVERED") return 4;
  return 0;
}

export function OrderStatusTimeline({ status }: { status: string }) {
  const activeIdx = stepIndexForStatus(status);
  const isFailed = TERMINAL_BAD.includes(status);

  if (isFailed) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
        Sipariş tamamlanamadı veya iptal edildi.
      </div>
    );
  }

  return (
    <ol className="flex items-center justify-between gap-1">
      {STEPS.map((step, idx) => {
        const done = idx <= activeIdx;
        const current = idx === activeIdx;
        return (
          <li key={step.key} className="flex flex-1 flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                done
                  ? current
                    ? "bg-accent-strong text-white ring-4 ring-accent-soft"
                    : "bg-accent-strong text-white"
                  : "bg-app-bg text-text-muted ring-1 ring-border",
              )}
            >
              {idx + 1}
            </div>
            <span
              className={cn(
                "mt-1.5 text-center text-[9px] font-medium leading-tight",
                current ? "text-accent-strong" : "text-text-muted",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
