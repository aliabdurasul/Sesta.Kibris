/**
 * Legacy /merchants/[slug] — permanent redirect to canonical /market/[slug].
 */
import { notFound, permanentRedirect } from "next/navigation";
import { resolveMarketBySlug } from "@/lib/market/resolve-by-slug";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LegacyMerchantSlugRedirect({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await resolveMarketBySlug(slug, { allowInactive: true });

  if (!resolved) {
    notFound();
  }

  permanentRedirect(`/market/${resolved.canonicalSlug}`);
}
