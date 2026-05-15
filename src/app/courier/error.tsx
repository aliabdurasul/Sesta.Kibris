"use client";

/**
 * Courier route error boundary.
 * Catches unexpected render errors in /courier/* routes.
 */
import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CourierError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[CourierError]", error.message);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 text-4xl">⚠️</div>
        <h2 className="text-lg font-bold text-gray-900">Bir sorun oluştu</h2>
        <p className="mt-2 text-sm text-gray-500">
          Kurye paneli yüklenirken beklenmedik bir hata meydana geldi.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={reset}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
          <a
            href="/courier"
            className="block w-full rounded-xl bg-gray-100 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Panele Dön
          </a>
        </div>
      </div>
    </div>
  );
}
