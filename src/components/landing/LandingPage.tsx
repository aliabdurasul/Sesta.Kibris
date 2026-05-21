import { Suspense } from "react";
import type { SessionUser } from "@/lib/auth";
import { HomeHeader } from "@/components/landing/HomeHeader";
import { HomeLocationSearch } from "@/components/landing/HomeLocationSearch";
import { QuickInfoCards } from "@/components/landing/QuickInfoCards";
import { PromoHeroSlider } from "@/components/landing/PromoHeroSlider";
import { buildPromoSlidesFromMerchants } from "@/lib/landing/promo-slides";
import { CategoryScroll } from "@/components/landing/CategoryScroll";
import { MarketBrowseSection } from "@/components/landing/MarketBrowseSection";
import { TrustBenefits } from "@/components/landing/TrustBenefits";
import type { MarketCardMerchant } from "@/components/landing/MarketCard";

interface LandingPageProps {
  merchants: MarketCardMerchant[];
  error: string | null;
  session: SessionUser | null;
}

export function LandingPage({ merchants, error, session }: LandingPageProps) {
  const promoSlides = buildPromoSlidesFromMerchants(merchants);
  const promoBanner =
    merchants.length > 0
      ? `${merchants[0]!.name} — bugün sipariş ver, kapına gelsin`
      : null;

  return (
    <div className="home-screen min-h-screen bg-app-bg">
      <HomeHeader session={session} promoText={promoBanner} />

      <div className="mx-auto max-w-lg space-y-5 pb-4 pt-2 animate-fade-in">
        <HomeLocationSearch />
        <QuickInfoCards />
        <PromoHeroSlider slides={promoSlides} />

        <div id="categories">
          <Suspense fallback={null}>
            <CategoryScroll />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              Marketler yükleniyor…
            </div>
          }
        >
          <MarketBrowseSection merchants={merchants} error={error} />
        </Suspense>

        <TrustBenefits />
      </div>
    </div>
  );
}
