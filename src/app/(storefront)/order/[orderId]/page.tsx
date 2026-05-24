/**
 * Guest order tracking — /order/[orderId]
 * No login required; access via localStorage guest token.
 */
import { Suspense } from "react";
import Link from "next/link";
import { GuestOrderTracker } from "@/components/order/GuestOrderTracker";
import { isValidOrderId } from "@/lib/guest/token";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sipariş Takibi — SestaKıbrıs",
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function GuestOrderPage({ params }: PageProps) {
  const { orderId } = await params;

  if (!isValidOrderId(orderId)) {
    notFound();
  }

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
          <h1 className="text-xl font-bold text-gray-900">Sipariş Takibi</h1>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-16 text-gray-400">
              Yükleniyor…
            </div>
          }
        >
          <GuestOrderTracker orderId={orderId} />
        </Suspense>
      </div>
    </main>
  );
}
