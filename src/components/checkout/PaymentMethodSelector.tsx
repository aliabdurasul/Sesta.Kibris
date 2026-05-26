"use client";

/**
 * Mobile-first payment method radios for /checkout.
 * Card option only shown when merchant supports online payments.
 */
export type PaymentMethodChoice = "cod" | "card";

export interface PaymentMethodSelectorProps {
  value: PaymentMethodChoice;
  onChange: (value: PaymentMethodChoice) => void;
  cardAvailable: boolean;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  value,
  onChange,
  cardAvailable,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="mb-3 font-semibold text-gray-900">Ödeme Yöntemi</h2>
      <div className="space-y-2" role="radiogroup" aria-label="Ödeme yöntemi">
        <label
          className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
            value === "cod"
              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100"
          } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            type="radio"
            name="payment_method"
            value="cod"
            checked={value === "cod"}
            onChange={() => onChange("cod")}
            disabled={disabled}
            className="h-5 w-5 shrink-0 accent-blue-600"
          />
          <span className="flex flex-col text-left">
            <span className="text-sm font-semibold text-gray-900">
              Kapıda Nakit Ödeme
            </span>
            <span className="text-xs text-gray-500">
              Teslimatta nakit veya kart ile ödeyin
            </span>
          </span>
        </label>

        {cardAvailable ? (
          <label
            className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
              value === "card"
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
            } ${disabled ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="payment_method"
              value="card"
              checked={value === "card"}
              onChange={() => onChange("card")}
              disabled={disabled}
              className="h-5 w-5 shrink-0 accent-blue-600"
            />
            <span className="flex flex-col text-left">
              <span className="text-sm font-semibold text-gray-900">
                Kredi / Banka Kartı
              </span>
              <span className="text-xs text-gray-500">
                Güvenli Stripe ödeme sayfasına yönlendirilirsiniz
              </span>
            </span>
          </label>
        ) : (
          <p className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 ring-1 ring-gray-100">
            Bu market şu an kartla ödeme kabul etmiyor.
          </p>
        )}
      </div>
    </div>
  );
}
