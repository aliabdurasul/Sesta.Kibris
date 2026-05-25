"use client";

import { MerchantCartSwitchModal } from "@/components/cart/MerchantCartSwitchModal";
import { useMerchantCartConflict } from "@/components/cart/useMerchantCartConflict";

export function MerchantCartGuard({
  merchantId,
  children,
}: {
  merchantId: string;
  children: React.ReactNode;
}) {
  const { open, dismiss, continueSwitch } = useMerchantCartConflict(merchantId);

  return (
    <>
      <MerchantCartSwitchModal
        open={open}
        onCancel={dismiss}
        onContinue={continueSwitch}
      />
      {children}
    </>
  );
}
