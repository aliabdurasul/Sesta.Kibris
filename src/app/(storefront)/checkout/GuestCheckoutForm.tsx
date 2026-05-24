"use client";

/**
 * Fast guest checkout — name, phone, address only. No account required.
 * Uses guest_token in localStorage for order tracking.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/lib/cart-store";
import {
  getOrCreateGuestToken,
  rememberGuestOrder,
  saveGuestToken,
} from "@/lib/guest/token-client";
import { sanitizeGuestPhone } from "@/lib/guest/token";

const guestSchema = z.object({
  guestName: z.string().min(2, "Ad soyad zorunlu"),
  guestPhone: z.string().min(8, "Telefon zorunlu"),
  fullAddress: z.string().min(8, "Teslimat adresi zorunlu"),
  notes: z.string().optional(),
});

type GuestForm = z.infer<typeof guestSchema>;

export function GuestCheckoutForm() {
  const router = useRouter();
  const { items, merchantId, getTotal, clearCart } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
  });

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
        <p className="text-lg">Sepetiniz boş</p>
        <a
          href="/#browse-markets"
          className="mt-4 inline-block text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
        >
          Marketlere dön
        </a>
      </div>
    );
  }

  const total = getTotal();

  const onSubmit = async (data: GuestForm) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const guestToken = getOrCreateGuestToken();
      const body = {
        merchant_id: merchantId,
        guest_token: guestToken,
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        delivery_address: {
          full_address: data.fullAddress.trim(),
          district: "Genel",
        },
        customer_notes: data.notes?.trim() || null,
        guest_name: data.guestName.trim(),
        guest_phone: sanitizeGuestPhone(data.guestPhone),
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        order_id?: string;
        guest_token?: string;
        error?: string;
      };

      if (!res.ok || !json.order_id) {
        throw new Error(json.error ?? "Sipariş oluşturulamadı.");
      }

      const persistedToken = json.guest_token ?? guestToken;
      saveGuestToken(persistedToken, json.order_id);
      clearCart();
      rememberGuestOrder(json.order_id);
      router.push(`/order/${json.order_id}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.",
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
        Hesap gerekmez — 1 dakikada sipariş verin.
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold text-gray-900">Sipariş Özeti</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">
                {((item.price * item.quantity) / 100).toFixed(2)} ₺
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 font-bold">
          <span>Toplam</span>
          <span>{(total / 100).toFixed(2)} ₺</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900">Teslimat Bilgileri</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ad Soyad *
          </label>
          <input
            {...register("guestName")}
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            placeholder="Adınız Soyadınız"
          />
          {errors.guestName && (
            <p className="mt-1 text-xs text-red-500">{errors.guestName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Telefon *
          </label>
          <input
            {...register("guestPhone")}
            type="tel"
            autoComplete="tel"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            placeholder="05xx xxx xx xx"
          />
          {errors.guestPhone && (
            <p className="mt-1 text-xs text-red-500">{errors.guestPhone.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Teslimat Adresi *
          </label>
          <textarea
            {...register("fullAddress")}
            rows={3}
            autoComplete="street-address"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            placeholder="Mahalle, sokak, bina no, daire"
          />
          {errors.fullAddress && (
            <p className="mt-1 text-xs text-red-500">
              {errors.fullAddress.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Not (opsiyonel)
          </label>
          <input
            {...register("notes")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
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
        className="w-full rounded-2xl bg-blue-600 py-4 text-base font-bold text-white disabled:opacity-60"
      >
        {submitting ? "Gönderiliyor..." : "Siparişi Ver"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Hesabınız var mı?{" "}
        <a
          href="/auth/login?redirectTo=/checkout"
          className="text-blue-600 hover:underline"
        >
          Giriş yapın
        </a>
      </p>
    </form>
  );
}
