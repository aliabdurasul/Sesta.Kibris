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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <a href="/merchants" className="text-lg font-bold text-gray-900">
            SestaKıbrıs
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
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
