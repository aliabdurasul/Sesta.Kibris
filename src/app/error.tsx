"use client";

/**
 * Route-level error boundary for all /app pages.
 * Catches Server Component render errors and shows a clean Turkish UI.
 * Never shows raw stack traces, digest IDs, or Next.js internals.
 */
import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: Props) {
  useEffect(() => {
    // Log to console only in dev; replace with your logging service in prod
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error.message);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900">
          Bir sorun oluştu
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Sayfa yüklenirken beklenmedik bir hata meydana geldi. Lütfen tekrar
          deneyin.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={reset}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
          <a
            href="/"
            className="block w-full rounded-xl bg-gray-100 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Ana Sayfaya Dön
          </a>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-xl py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              Çıkış Yap
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
