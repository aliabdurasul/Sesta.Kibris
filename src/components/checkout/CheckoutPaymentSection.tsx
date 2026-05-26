"use client";

import { useEffect, useState } from "react";
import {
  PaymentMethodSelector,
  type PaymentMethodChoice,
} from "./PaymentMethodSelector";

interface Capabilities {
  cardAvailable: boolean;
}

interface CheckoutPaymentSectionProps {
  merchantId: string | null;
  value: PaymentMethodChoice;
  onChange: (value: PaymentMethodChoice) => void;
  disabled?: boolean;
}

export function CheckoutPaymentSection({
  merchantId,
  value,
  onChange,
  disabled,
}: CheckoutPaymentSectionProps) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!merchantId) {
      setCapabilities(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetch(`/api/merchants/${merchantId}/payment-capabilities`)
      .then((res) => res.json())
      .then((json: Capabilities & { error?: string }) => {
        if (cancelled) return;
        setCapabilities({ cardAvailable: Boolean(json.cardAvailable) });
        if (!json.cardAvailable && value === "card") {
          onChange("cod");
        }
      })
      .catch(() => {
        if (!cancelled) setCapabilities({ cardAvailable: false });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [merchantId, onChange, value]);

  if (!merchantId) return null;

  return (
    <div className={loading ? "opacity-70" : undefined}>
      <PaymentMethodSelector
        value={value}
        onChange={onChange}
        cardAvailable={capabilities?.cardAvailable ?? false}
        disabled={disabled || loading}
      />
    </div>
  );
}
