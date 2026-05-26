/**
 * Legacy Stripe Connect URL — merchants are redirected to platform payments settings.
 */
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isStripeConnectEnabled } from "@/lib/stripe/features";
import { ConnectStatusCard } from "@/components/stripe/ConnectStatusCard";
import Link from "next/link";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ legacy?: string }>;
}) {
  await requireRole("merchant");
  const { legacy } = await searchParams;

  const showLegacyConnect =
    legacy === "1" && isStripeConnectEnabled();

  if (!showLegacyConnect) {
    redirect("/merchant/payments");
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg bg-app-bg px-4 py-8">
      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Geliştirici modu: Stripe Connect (legacy). Normal kullanım için{" "}
        <Link href="/merchant/payments" className="underline">
          Ödemeler
        </Link>
        .
      </p>
      <ConnectStatusCard />
    </div>
  );
}
