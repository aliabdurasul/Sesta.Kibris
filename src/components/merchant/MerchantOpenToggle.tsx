"use client";

import { useTransition } from "react";
import { setMerchantOpen } from "@/app/merchant/actions";

interface Props {
  isOpen: boolean;
  isActive: boolean;
}

export function MerchantOpenToggle({ isOpen, isActive }: Props) {
  const [pending, startTransition] = useTransition();

  if (!isActive) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
        Platformda pasif
      </span>
    );
  }

  const toggle = () => {
    startTransition(async () => {
      await setMerchantOpen(!isOpen);
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
        isOpen
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {pending ? "…" : isOpen ? "Açık — Kapat" : "Kapalı — Aç"}
    </button>
  );
}
