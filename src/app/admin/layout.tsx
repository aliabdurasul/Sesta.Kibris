/**
 * Admin layout — guards all /admin/* routes.
 * Requires role=admin.
 */
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-gray-900">SestaKıbrıs Admin</h1>
            <nav className="hidden items-center gap-3 sm:flex">
              <a
                href="/admin"
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Siparişler
              </a>
              <a
                href="/admin/actors"
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Aktörler
              </a>
            </nav>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Çıkış
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
