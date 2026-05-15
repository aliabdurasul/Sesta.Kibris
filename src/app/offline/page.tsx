import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İnternet Bağlantısı Yok — SestaKıbrıs",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 text-5xl">📡</div>
        <h1 className="text-xl font-bold text-gray-900">Bağlantı Yok</h1>
        <p className="mt-2 text-sm text-gray-500">
          İnternet bağlantınız kesildi. Lütfen bağlantınızı kontrol edip tekrar deneyin.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Tekrar Dene
        </button>
        <a
          href="/"
          className="mt-3 block text-sm text-gray-400 hover:text-gray-600"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
}
