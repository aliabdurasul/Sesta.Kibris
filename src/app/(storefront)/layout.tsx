/**
 * Public storefront layout.
 * No auth required to browse.
 * Header shows contextual action: login (guest) or dashboard link (logged in).
 */
import { CartBar } from "@/components/cart/CartBar";
import { getSession, getRoleHomePath } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-sesta-bg-light">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <a href="/" className="block">
            <span className="text-lg font-bold text-sesta-navy">SestaKıbrıs</span>
            <span className="block text-xs font-medium text-gray-500">
              Kıbrıs&apos;ın Sepeti
            </span>
          </a>

          {session ? (
            <a
              href={getRoleHomePath(session.role)}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Panelim →
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/checkout"
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Misafir
              </a>
              <a
                href="/auth/login"
                className="rounded-lg bg-sesta-navy px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sesta-navy/90"
              >
                Giriş
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">{children}</main>
      <CartBar />
    </div>
  );
}
