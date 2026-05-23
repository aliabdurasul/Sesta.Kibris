import { buildAbsoluteUrl, toAbsoluteMediaUrl } from "@/lib/site-config";
import { getMarketCoverImage } from "@/lib/landing/market-images";

type MarketJsonLdProps = {
  name: string;
  slug: string;
  category: string;
  merchantId: string;
  address?: string | null;
  coverUrl?: string;
  description?: string | null;
};

export function MarketJsonLd({
  name,
  slug,
  category,
  merchantId,
  address,
  coverUrl,
  description: customDescription,
}: MarketJsonLdProps) {
  const url = buildAbsoluteUrl(`/market/${slug}`);
  const description =
    customDescription?.trim() ||
    `${name} üzerinden taze ürünler, hızlı teslimat ve güvenli ödeme ile online market alışverişi yapın.`;
  const image =
    toAbsoluteMediaUrl(coverUrl) ||
    buildAbsoluteUrl(getMarketCoverImage(category, merchantId));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Store",
    name,
    url,
    description,
    image,
  };

  if (address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: address,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
