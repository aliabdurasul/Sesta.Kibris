import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS_LABELS } from "@/lib/orders/order-status-labels";

const STATUS_TONE: Record<
  string,
  "neutral" | "accent" | "success" | "warning" | "danger" | "orange"
> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  READY: "accent",
  ASSIGNED: "orange",
  PICKED_UP: "orange",
  IN_TRANSIT: "orange",
  DELIVERED: "success",
  REJECTED: "danger",
  FAILED_DELIVERY: "danger",
  CANCELLED: "neutral",
};

export function StatusChip({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const label = ORDER_STATUS_LABELS[status] ?? status;
  return <Badge tone={tone}>{label}</Badge>;
}
