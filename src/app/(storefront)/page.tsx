import { LandingPage } from "@/components/landing/LandingPage";
import { getSession } from "@/lib/auth";
import { getPublicMerchants } from "@/lib/merchants/list-public";
import { getActiveHomepagePromoSlides } from "@/lib/promos/queries";

export const metadata = {
  title: "SestaKıbrıs — Kıbrıs'ın günlük yaşam uygulaması",
  description:
    "Market, su, tüp ve kampüs siparişi. Hızlı teslimat, güvenli ödeme.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [session, { merchants, error }, promoSlides] = await Promise.all([
    getSession(),
    getPublicMerchants(),
    getActiveHomepagePromoSlides(),
  ]);

  return (
    <LandingPage
      merchants={merchants}
      promoSlides={promoSlides}
      error={error}
      session={session}
    />
  );
}
