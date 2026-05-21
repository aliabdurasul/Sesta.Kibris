import { Suspense } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBanner } from "@/components/landing/TrustBanner";
import { CategoryGrid } from "@/components/landing/CategoryGrid";
import {
  FeaturedAdsCarousel,
  type FeaturedSlide,
} from "@/components/landing/FeaturedAdsCarousel";
import { MarketBrowseSection } from "@/components/landing/MarketBrowseSection";
import type { MarketCardMerchant } from "@/components/landing/MarketCard";

interface LandingPageProps {
  merchants: MarketCardMerchant[];
  error: string | null;
}

function buildFeaturedSlides(merchants: MarketCardMerchant[]): FeaturedSlide[] {
  return merchants.slice(0, 3).map((m, i) => ({
    id: m.id,
    title: m.name,
    description:
      m.is_open === false
        ? "Şu an kapalı — çalışma saatlerinde ziyaret edin."
        : "Hızlı teslimat ve güvenli sipariş.",
    badge: i === 0 ? "Sponsorlu" : "Öne Çıkan",
    href: `/merchants/${m.slug}`,
  }));
}

export function LandingPage({ merchants, error }: LandingPageProps) {
  const featuredSlides = buildFeaturedSlides(merchants);

  return (
    <div className="space-y-10 pb-4">
      <HeroSection />
      <FeaturedAdsCarousel slides={featuredSlides} />
      <CategoryGrid />
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-gray-400">
            Marketler yükleniyor…
          </div>
        }
      >
        <MarketBrowseSection merchants={merchants} error={error} />
      </Suspense>
      <TrustBanner />
    </div>
  );
}
