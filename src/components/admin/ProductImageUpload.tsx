"use client";

import { useEffect, useRef, useState } from "react";
import {
  isRejectedImagePayload,
  isValidHttpUrl,
  resolveProductImageUrl,
} from "@/lib/validation/http-url";

interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ProductImageUpload({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displaySrc =
    preview ?? (value && !isRejectedImagePayload(value) ? resolveProductImageUrl(value) : null);

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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Yükleme başarısız.");
      }

      if (isRejectedImagePayload(json.url)) {
        throw new Error("Use uploaded image URL only");
      }

      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleExternalUrl = (raw: string) => {
    setError(null);
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      return;
    }
    if (isRejectedImagePayload(trimmed)) {
      setError(
        "Base64 veya data URL kullanılamaz. Dosya yükleyin veya https bağlantısı girin.",
      );
      return;
    }
    if (!isValidHttpUrl(trimmed)) {
      setError("Geçerli bir https:// görsel adresi girin.");
      return;
    }
    onChange(trimmed);
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Ürün görseli</label>

      {displaySrc && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt="Önizleme"
            className="h-32 w-32 rounded-xl object-cover ring-1 ring-gray-200"
          />
          {!disabled && (
            <button
              type="button"
              className="absolute -right-2 -top-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-white"
              onClick={() => {
                onChange("");
                if (preview?.startsWith("blob:")) {
                  URL.revokeObjectURL(preview);
                }
                setPreview(null);
              }}
            >
              ×
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
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
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">
          veya harici https URL (opsiyonel)
        </label>
        <input
          type="url"
          value={value.startsWith("http") ? value : ""}
          disabled={disabled || uploading}
          placeholder="https://cdn.example.com/product.webp"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
          onChange={(e) => handleExternalUrl(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <p className="text-xs text-gray-400">
        Görsel önce depolamaya yüklenir; veritabanına yalnızca https URL kaydedilir.
      </p>
    </div>
  );
}
