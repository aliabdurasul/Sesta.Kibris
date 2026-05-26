/**
 * Merchant Stripe Connect onboarding page.
 * Route: /connect
 */
import { requireRole } from "@/lib/auth";
import { ConnectStatusCard } from "@/components/stripe/ConnectStatusCard";
import Link from "next/link";

export default async function ConnectPage() {
  await requireRole("merchant");

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg bg-app-bg px-4 py-8">
      <Link href="/merchant" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">
        ← Merchant paneli
      </Link>
      <ConnectStatusCard />
    </div>
  );
}
