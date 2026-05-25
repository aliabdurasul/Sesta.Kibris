"use client";

import { Modal } from "@/components/ui/Modal";

interface Props {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
}

export function MerchantCartSwitchModal({
  open,
  onCancel,
  onContinue,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} title="Sepet farklı markette">
      <p className="text-sm leading-relaxed text-text-secondary">
        Sepetinizde başka bir marketten ürünler var. Devam ederseniz mevcut
        sepetiniz silinir.
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-text-primary"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 rounded-xl bg-accent-strong py-2.5 text-sm font-semibold text-white"
        >
          Devam et
        </button>
      </div>
    </Modal>
  );
}
