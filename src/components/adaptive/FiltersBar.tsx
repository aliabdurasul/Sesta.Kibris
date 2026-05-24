"use client";

import { useState } from "react";
import { cn } from "@/lib/ui/cn";
import { useUiContext } from "@/components/layouts/UiProvider";
import { Modal } from "@/components/ui/Modal";

export function FiltersBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { context } = useUiContext();
  const [open, setOpen] = useState(false);

  if (context !== "operator") {
    return null;
  }

  return (
    <>
      <div className={cn("mb-4 hidden flex-wrap items-center gap-3 lg:flex", className)}>
        {children}
      </div>

      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-xl bg-brand-white px-4 py-3 text-sm font-medium text-text-secondary ring-1 ring-border"
        >
          Filtrele ve sırala
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Filtreler">
        <div className="space-y-3">{children}</div>
      </Modal>
    </>
  );
}
