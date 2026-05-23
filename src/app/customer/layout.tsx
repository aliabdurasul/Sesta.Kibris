/**
 * Customer layout — /customer/*
 * Guards all customer routes. Role=customer required.
 */
export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth";
import { CustomerNav } from "@/components/customer/CustomerNav";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("customer");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <a href="/" className="text-lg font-bold text-gray-900">
            SestaKıbrıs
          </a>
          <span className="text-sm text-gray-400">{session.email}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <CustomerNav />
    </div>
  );
}
