"use client";

import { useTransition } from "react";
import {
  setMerchantActive,
  setMerchantOpen,
} from "@/app/admin/actors/actions";

interface Props {
  merchantId: string;
  isActive: boolean;
  isOpen: boolean;
}

export function MerchantAdminToggles({
  merchantId,
  isActive,
  isOpen,
}: Props) {
  const [pending, startTransition] = useTransition();

  const toggleActive = () => {
    startTransition(async () => {
      await setMerchantActive(merchantId, !isActive);
    });
  };

  const toggleOpen = () => {
    startTransition(async () => {
      await setMerchantOpen(merchantId, !isOpen);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={pending}
        onClick={toggleActive}
        title="Platformda listelenir (is_active)"
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
          isActive
            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
            : "bg-red-100 text-red-700 hover:bg-red-200"
        }`}
      >
        {isActive ? "Aktif ✓" : "Pasif — Aktifleştir"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={toggleOpen}
        title="Sipariş kabul ediyor (is_open)"
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
          isOpen
            ? "bg-green-100 text-green-800 hover:bg-green-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {isOpen ? "Açık ✓" : "Kapalı — Aç"}
      </button>
    </div>
  );
}
