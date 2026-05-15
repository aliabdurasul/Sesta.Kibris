/**
 * Public storefront layout.
 * Wraps all public-facing pages (merchant list, merchant detail).
 * No auth required.
 */
import { CartBar } from "@/components/cart/CartBar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <a href="/" className="text-lg font-bold text-gray-900">
            SestaKıbrıs
          </a>
          <a
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Giriş Yap
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">{children}</main>
      <CartBar />
    </div>
  );
}
