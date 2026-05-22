import type { Metadata } from "next";
import { env } from "@/lib/env";
import { getMarketCoverImage } from "@/lib/landing/market-images";

export type MarketSeoInput = {
  name: string;
  slug: string;
  category: string;
  merchantId: string;
  address?: string | null;
  noindex?: boolean;
};

export function buildMarketMetadata(input: MarketSeoInput): Metadata {
  const { name, slug, category, merchantId, noindex } = input;
  const title = `${name} | Kıbrıs Online Market`;
  const description = `${name} üzerinden taze ürünler, hızlı teslimat ve güvenli ödeme ile online market alışverişi yapın.`;
  const keywords = [
    name,
    "Kıbrıs market",
    "online grocery",
    "local delivery",
  ];
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/market/${slug}`;
  const imagePath = getMarketCoverImage(category, merchantId);
  const imageUrl = `${env.NEXT_PUBLIC_APP_URL}${imagePath}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "SestaKıbrıs",
      locale: "tr_TR",
      type: "website",
      images: [{ url: imageUrl, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
