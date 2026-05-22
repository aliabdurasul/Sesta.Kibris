import { Suspense } from "react";
import type { SessionUser } from "@/lib/auth";
import { BrowseHeader } from "@/components/landing/BrowseHeader";
import { PromoHeroSlider } from "@/components/landing/PromoHeroSlider";
import { buildPromoSlidesFromMerchants } from "@/lib/landing/promo-slides";
import { CategoryScroll } from "@/components/landing/CategoryScroll";
import { MarketBrowseSection } from "@/components/landing/MarketBrowseSection";
import type { MarketCardMerchant } from "@/components/landing/MarketCard";

interface LandingPageProps {
  merchants: MarketCardMerchant[];
  error: string | null;
  session: SessionUser | null;
}

export function LandingPage({ merchants, error, session }: LandingPageProps) {
  const promoSlides = buildPromoSlidesFromMerchants(merchants);

  return (
    <div className="home-screen min-h-screen bg-app-bg">
      <BrowseHeader session={session} />

      <div className="mx-auto max-w-lg space-y-4 pb-2 pt-1 animate-fade-in">
        <PromoHeroSlider slides={promoSlides} />

        <Suspense fallback={null}>
          <CategoryScroll />
        </Suspense>

        <Suspense
          fallback={
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              Yükleniyor…
            </div>
          }
        >
          <MarketBrowseSection merchants={merchants} error={error} />
        </Suspense>
      </div>
    </div>
  );
}
