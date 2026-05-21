"use client";

/**
 * Checkout form.
 *
 * Reads cart from zustand store.
 * Validates delivery address with zod + react-hook-form.
 * POSTs to the Supabase Edge Function: /functions/v1/create-order.
 * The Edge Function recalculates totals — client total is display only.
 *
 * On success: clears cart and redirects to /customer/orders/[orderId].
 */
import { useEffect, useState } from "react";
import { resolveOrderIdFromCreateResponse } from "@/lib/orders/resolve-order-id";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/lib/cart-store";

const addressSchema = z.object({
  addressId: z.string().optional(),
  fullAddress: z.string().min(10, "Adres en az 10 karakter olmalı"),
  district: z.string().min(2, "Mahalle / bölge zorunlu"),
  notes: z.string().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

interface SavedAddress {
  id: string;
  label: string | null;
  full_address: string;
  district: string;
  is_default: boolean | null;
}

interface CheckoutFormProps {
  savedAddresses: SavedAddress[];
  userId: string;
}

export function CheckoutForm({ savedAddresses, userId: _userId }: CheckoutFormProps) {
  const { items, merchantId, getTotal, clearCart } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(savedAddresses.length === 0);

  const defaultAddress = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressId: defaultAddress?.id,
      fullAddress: defaultAddress?.full_address ?? "",
      district: defaultAddress?.district ?? "",
    },
  });

  // Hydration guard — cart is in sessionStorage
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
        <p className="text-lg">Sepetiniz boş — haydi alışverişe!</p>
        <a
          href="/merchants"
          className="mt-4 inline-block text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
        >
          Marketlere dön
        </a>
      </div>
    );
  }

  const total = getTotal();

  const onSelectSaved = (addr: SavedAddress) => {
    setUseNewAddress(false);
    setValue("addressId", addr.id);
    setValue("fullAddress", addr.full_address);
    setValue("district", addr.district);
  };

  const onSubmit = async (data: AddressForm) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const body = {
        merchant_id: merchantId,
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        delivery_address: {
          full_address: data.fullAddress,
          district: data.district,
        },
        customer_notes: data.notes ?? null,
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        throw new Error(
          (typeof json["error"] === "string" ? json["error"] : null) ??
            "Sipariş oluşturulamadı.",
        );
      }

      const orderId = resolveOrderIdFromCreateResponse(json);
      if (!orderId) {
        throw new Error("Sipariş oluşturuldu ancak sipariş numarası alınamadı.");
      }

      const target = `/customer/orders/${orderId}`;
      clearCart();
      window.location.assign(target);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.",
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Cart summary */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold text-gray-900">Sipariş Özeti</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.name}{" "}
                <span className="text-gray-400">× {item.quantity}</span>
              </span>
              <span className="font-medium text-gray-900">
                {((item.price * item.quantity) / 100).toFixed(2)} ₺
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
          <span>Toplam (tahmini)</span>
          <span>{(total / 100).toFixed(2)} ₺</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Kesin tutar sipariş onayında hesaplanır.
        </p>
      </div>

      {/* Address selection */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold text-gray-900">Teslimat Adresi</h2>

        {savedAddresses.length > 0 && (
          <div className="mb-4 space-y-2">
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelectSaved(addr)}
                className={`w-full rounded-xl p-3 text-left text-sm ring-1 transition-colors ${
                  !useNewAddress && addr.id === defaultAddress?.id
                    ? "bg-blue-50 ring-blue-300 text-blue-900"
                    : "bg-gray-50 ring-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="font-medium">{addr.label ?? "Adres"}</span>
                <span className="ml-2 text-gray-500">{addr.full_address}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseNewAddress(true)}
              className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
            >
              + Yeni adres gir
            </button>
          </div>
        )}

        {useNewAddress && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Adres
              </label>
              <textarea
                {...register("fullAddress")}
                rows={3}
                placeholder="Sokak, bina no, daire..."
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.fullAddress && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.fullAddress.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mahalle / Bölge
              </label>
              <input
                {...register("district")}
                type="text"
                placeholder="Lefkoşa, Girne..."
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.district && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.district.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700">
            Sipariş Notu (opsiyonel)
          </label>
          <input
            {...register("notes")}
            type="text"
            placeholder="Zil çalışmıyor, lütfen arayın..."
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-base font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sipariş gönderiliyor..." : "Siparişi Onayla"}
      </button>
    </form>
  );
}
