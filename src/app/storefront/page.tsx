/**
 * MVP Stripe product storefront (demo catalog).
 * Route: /storefront — lists stripe_products with buy buttons.
 */
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { StripeProductCard } from "@/components/stripe/ProductCard";
import { unwrapRelated } from "@/lib/stripe/db-helpers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StripeStorefrontPage() {
  const admin = createStripeAdminClient();
  const { data: rows } = await admin
    .from("stripe_products")
    .select("id, name, description, unit_amount, merchant_id, merchants(name)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products = (rows ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    description: (p.description as string | null) ?? null,
    unit_amount: p.unit_amount as number,
    merchant_id: p.merchant_id as string,
    merchants: unwrapRelated(
      p.merchants as { name: string } | { name: string }[] | null,
    ),
  }));

  return (
    <div className="min-h-[100dvh] bg-app-bg">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Kart ile öde — MVP vitrin</h1>
          <Link href="/" className="text-sm text-accent-strong">
            Ana sayfa
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <p className="mb-4 text-sm text-gray-500">
          Demo vitrin (platform Stripe). Gerçek siparişler{" "}
          <code className="text-xs">/market/[slug]</code> ve{" "}
          <code className="text-xs">/checkout</code> üzerinden verilir.
        </p>

        {!products.length ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-400 ring-1 ring-gray-100">
            Henüz demo ürün yok. Merchant: /merchant/payments → kartı açın, API ile ürün ekleyin.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {products.map((p) => (
              <StripeProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
