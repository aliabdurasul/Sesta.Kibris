/**
 * Guest order list — /orders/guest
 * Lists orders for the current localStorage guest token.
 */
import Link from "next/link";
import { GuestOrdersList } from "@/components/order/GuestOrdersList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Misafir Siparişlerim — SestaKıbrıs",
};

export default function GuestOrdersPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/#browse-markets"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Ana sayfa
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Siparişlerim</h1>
        </div>
        <GuestOrdersList />
      </div>
    </main>
  );
}
