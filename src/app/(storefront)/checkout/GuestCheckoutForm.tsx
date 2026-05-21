"use client";

/**
 * Guest checkout — no authentication required.
 * POSTs to create-order with guest_name + guest_phone (no JWT).
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/lib/cart-store";

const guestSchema = z.object({
  guestName: z.string().min(2, "Ad soyad zorunlu"),
  guestPhone: z.string().min(8, "Telefon zorunlu"),
  guestEmail: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Geçerli e-posta girin",
    }),
  fullAddress: z.string().min(10, "Adres en az 10 karakter olmalı"),
  district: z.string().min(2, "Mahalle / bölge zorunlu"),
  notes: z.string().optional(),
});

type GuestForm = z.infer<typeof guestSchema>;

interface Props {
  guestUserId: string | null;
}

export function GuestCheckoutForm({ guestUserId }: Props) {
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
        <p className="text-lg">Sepetiniz boş.</p>
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

  const onSubmit = async (data: GuestForm) => {
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
        ...(guestUserId ? { guest_user_id: guestUserId } : {}),
        guest_name: data.guestName.trim(),
        guest_phone: data.guestPhone.trim(),
        guest_email: data.guestEmail?.trim() || null,
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { order_id?: string; error?: string };

      if (!res.ok || !json.order_id) {
        throw new Error(json.error ?? "Sipariş oluşturulamadı.");
      }

      clearCart();
      router.push(`/checkout/success?order=${json.order_id}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.",
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800 ring-1 ring-blue-200">
        Misafir olarak sipariş veriyorsunuz — hesap gerekmez.
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
          <span>Toplam (tahmini)</span>
          <span>{(total / 100).toFixed(2)} ₺</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900">İletişim</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ad Soyad *
          </label>
          <input
            {...register("guestName")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          {errors.guestName && (
            <p className="mt-1 text-xs text-red-500">{errors.guestName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            E-posta (opsiyonel)
          </label>
          <input
            {...register("guestEmail")}
            type="email"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Telefon *
          </label>
          <input
            {...register("guestPhone")}
            type="tel"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          {errors.guestPhone && (
            <p className="mt-1 text-xs text-red-500">{errors.guestPhone.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Adres *
          </label>
          <textarea
            {...register("fullAddress")}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          {errors.fullAddress && (
            <p className="mt-1 text-xs text-red-500">
              {errors.fullAddress.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mahalle / Bölge *
          </label>
          <input
            {...register("district")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          {errors.district && (
            <p className="mt-1 text-xs text-red-500">{errors.district.message}</p>
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
        {submitting ? "Gönderiliyor..." : "Misafir Sipariş Ver"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Hesabınız var mı?{" "}
        <a href="/auth/login?redirectTo=/checkout" className="text-blue-600 hover:underline">
          Giriş yapın
        </a>
      </p>
    </form>
  );
}
