"use client";

/**
 * Global error boundary — catches errors in the root layout itself.
 * This is the last resort. Must be a Client Component.
 * Must include its own <html> and <body>.
 */
import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalError]", error.message);
    }
  }, [error]);

  return (
    <html lang="tr">
      <body className="bg-gray-50">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <div className="mb-4 text-5xl">🚨</div>
            <h1 className="text-xl font-bold text-gray-900">
              Sistem Hatası
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Uygulama beklenmedik bir şekilde çöktü. Sayfayı yenileyerek
              tekrar deneyin.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={reset}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white"
              >
                Sayfayı Yenile
              </button>
              <a
                href="/"
                className="block w-full rounded-xl bg-gray-100 py-3 text-center text-sm font-medium text-gray-700"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
