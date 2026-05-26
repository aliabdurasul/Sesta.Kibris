"use client";

import { useTransition } from "react";
import {
  markOrderSettled,
  markMerchantOrdersSettled,
} from "@/app/admin/finance/actions";

export function SettleOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markOrderSettled(orderId);
        })
      }
      className="rounded-lg bg-gray-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
    >
      {pending ? "…" : "Ödendi işaretle"}
    </button>
  );
}

export function SettleMerchantButton({ merchantId }: { merchantId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markMerchantOrdersSettled(merchantId);
        })
      }
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
    >
      {pending ? "…" : "Tümünü ödendi işaretle"}
    </button>
  );
}
