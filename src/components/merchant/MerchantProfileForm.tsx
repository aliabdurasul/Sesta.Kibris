"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import {
  uploadMerchantAsset,
  updateMerchantProfile,
  type ProfileFormState,
} from "@/app/merchant/profile/actions";
import {
  computeOnboardingProgress,
  parseOpeningHours,
  type OpeningHours,
} from "@/lib/market/onboarding";
import { getMarketInitials } from "@/lib/market/resolve-display";

const DAYS = [
  { key: "mon" as const, label: "Pazartesi" },
  { key: "tue" as const, label: "Salı" },
  { key: "wed" as const, label: "Çarşamba" },
  { key: "thu" as const, label: "Perşembe" },
  { key: "fri" as const, label: "Cuma" },
  { key: "sat" as const, label: "Cumartesi" },
  { key: "sun" as const, label: "Pazar" },
];

type MerchantProfileData = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  opening_hours: OpeningHours;
  delivery_time_min: number | null;
  delivery_time_max: number | null;
  delivery_fee: number | null;
  is_onboarded: boolean;
};

export function MerchantProfileForm({
  merchant,
}: {
  merchant: MerchantProfileData;
}) {
  const [logoUrl, setLogoUrl] = useState(merchant.logo_url);
  const [coverUrl, setCoverUrl] = useState(merchant.cover_image_url);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const hours = parseOpeningHours(
    merchant.opening_hours as unknown as import("@/types/database").Json,
  );

  const progress = computeOnboardingProgress({
    logo_url: logoUrl,
    cover_image_url: coverUrl,
    opening_hours: hours as unknown as import("@/types/database").Json,
    delivery_time_min: merchant.delivery_time_min,
    delivery_time_max: merchant.delivery_time_max,
  });

  const [state, formAction, pending] = useActionState<
    ProfileFormState,
    FormData
  >(updateMerchantProfile, null);

  async function handleUpload(type: "logo" | "cover", file: File) {
    setUploading(type);
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadMerchantAsset(type, fd);
    setUploading(null);
    if (!result.ok) {
      setUploadError(result.error ?? "Yükleme başarısız.");
      return;
    }
    if (result.url) {
      if (type === "logo") setLogoUrl(result.url);
      else setCoverUrl(result.url);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Profil durumu</p>
          <span className="text-sm font-medium text-blue-600">
            %{progress.percent}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        {progress.missing.length > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Eksik: {progress.missing.join(", ")}
          </p>
        )}
        {merchant.is_onboarded && (
          <p className="mt-2 text-xs font-medium text-green-700">
            Profil tamamlandı — listelemede öncelikli görünürsünüz.
          </p>
        )}
      </div>

      {(uploadError || state?.error) && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200"
        >
          {uploadError ?? state?.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
          {state.success}
        </div>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Görseller</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-gray-500">Logo</p>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative h-14 w-14 overflow-hidden rounded-xl ring-1 ring-gray-200">
                  <Image
                    src={logoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                  {getMarketInitials(merchant.name)}
                </div>
              )}
              <button
                type="button"
                disabled={uploading === "logo"}
                onClick={() => logoRef.current?.click()}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                {uploading === "logo" ? "Yükleniyor…" : "Logo yükle"}
              </button>
              <input
                ref={logoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload("logo", f);
                }}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-gray-500">Kapak görseli</p>
            <div className="space-y-2">
              {coverUrl && (
                <div className="relative aspect-[16/9] w-full max-w-[200px] overflow-hidden rounded-xl ring-1 ring-gray-200">
                  <Image
                    src={coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <button
                type="button"
                disabled={uploading === "cover"}
                onClick={() => coverRef.current?.click()}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                {uploading === "cover" ? "Yükleniyor…" : "Kapak yükle"}
              </button>
              <input
                ref={coverRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload("cover", f);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <form action={formAction} className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Mağaza bilgileri</h2>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Açıklama (isteğe bağlı)
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={merchant.description ?? ""}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Müşterilere kısa bir tanıtım yazın"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Min. teslimat (dk)
            </label>
            <input
              name="delivery_time_min"
              type="number"
              min={5}
              max={180}
              defaultValue={merchant.delivery_time_min ?? 15}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Maks. teslimat (dk)
            </label>
            <input
              name="delivery_time_max"
              type="number"
              min={5}
              max={240}
              defaultValue={merchant.delivery_time_max ?? 20}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Teslimat ücreti (TL, isteğe bağlı)
          </label>
          <input
            name="delivery_fee"
            type="number"
            min={0}
            step={0.01}
            defaultValue={
              merchant.delivery_fee != null
                ? merchant.delivery_fee / 100
                : ""
            }
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="0 = belirtilmedi"
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold text-gray-700">
            Çalışma saatleri
          </h3>
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const day = hours[key];
              const closed = day?.closed === true;
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-2 py-2 text-sm"
                >
                  <span className="w-24 shrink-0 text-xs font-medium text-gray-600">
                    {label}
                  </span>
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      name={`${key}_closed`}
                      defaultChecked={closed}
                    />
                    Kapalı
                  </label>
                  <input
                    name={`${key}_open`}
                    type="time"
                    defaultValue={day?.open ?? "08:00"}
                    disabled={closed}
                    className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-40"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    name={`${key}_close`}
                    type="time"
                    defaultValue={day?.close ?? "22:00"}
                    disabled={closed}
                    className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-40"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Profili kaydet"}
        </button>
      </form>
    </div>
  );
}
