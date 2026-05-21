/**
 * Delivery model rules — shared by UI and server.
 *
 * Flow: PENDING (created) → CONFIRMED → READY → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
 */
import type { DeliveryMode } from "@/types/database";

export const HYBRID_DEFAULT_TIMEOUT_MINUTES = 15;

export type MerchantDeliveryFields = {
  delivery_mode: DeliveryMode;
  hybrid_assign_timeout_minutes?: number | null;
};

export type OrderAssignmentFields = {
  status: string;
  ready_at: string | null;
  assignment_escalated_at?: string | null;
};

/** Merchant may assign / auto-dispatch couriers */
export function merchantCanAssign(mode: DeliveryMode): boolean {
  return mode === "MERCHANT_DELIVERY" || mode === "HYBRID";
}

/** Admin may assign platform courier to this READY order */
export function adminCanAssign(
  order: OrderAssignmentFields,
  merchant: MerchantDeliveryFields | null,
): boolean {
  if (order.status !== "READY") return false;
  const mode = merchant?.delivery_mode ?? "PLATFORM_COURIER";
  if (mode === "MERCHANT_DELIVERY") return false;
  if (mode === "PLATFORM_COURIER") return true;
  if (order.assignment_escalated_at) return true;
  if (!order.ready_at) return false;
  const minutes =
    merchant?.hybrid_assign_timeout_minutes ?? HYBRID_DEFAULT_TIMEOUT_MINUTES;
  const deadline =
    new Date(order.ready_at).getTime() + minutes * 60 * 1000;
  return Date.now() >= deadline;
}

export function adminAssignBlockedReason(
  order: OrderAssignmentFields,
  merchant: MerchantDeliveryFields | null,
): string | null {
  if (order.status !== "READY") return null;
  const mode = merchant?.delivery_mode ?? "PLATFORM_COURIER";
  if (mode === "MERCHANT_DELIVERY") {
    return "İşletme kendi kuryesini atar (izleme modu).";
  }
  if (mode === "HYBRID" && !adminCanAssign(order, merchant)) {
    const minutes =
      merchant?.hybrid_assign_timeout_minutes ?? HYBRID_DEFAULT_TIMEOUT_MINUTES;
    return `Hibrit: işletme ${minutes} dk içinde atamalı; süre dolunca platform atayabilir.`;
  }
  return null;
}

export function deliveryModeLabel(mode: DeliveryMode): string {
  switch (mode) {
    case "MERCHANT_DELIVERY":
      return "İşletme kuryesi";
    case "PLATFORM_COURIER":
      return "Platform kuryesi";
    case "HYBRID":
      return "Hibrit";
  }
}
