"use client";

import { useEffect, useRef, useState } from "react";
import { resolvePromoImageUrl } from "@/lib/storage/promo-banner";
import { isRejectedImagePayload } from "@/lib/validation/http-url";

interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

/** Admin promo banner upload — promo-banners bucket via /api/upload/promo */
export function PromoImageUpload({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displaySrc =
    preview ??
    (value && !isRejectedImagePayload(value) ? resolvePromoImageUrl(value) : null);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFile = async (file: File) => {
    setError(null);

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/upload/promo", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Yükleme başarısız.");
      }

      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Kampanya görseli (16:9 önerilir)
      </label>

      {displaySrc && (
        <div className="relative w-full max-w-md overflow-hidden rounded-xl ring-1 ring-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt="Kampanya önizleme"
            className="aspect-video w-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-xs text-white"
              onClick={() => {
                onChange("");
                if (preview?.startsWith("blob:")) {
                  URL.revokeObjectURL(preview);
                }
                setPreview(null);
              }}
            >
              Kaldır
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl bg-accent-strong px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {uploading ? "Yükleniyor…" : "Görsel yükle"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
