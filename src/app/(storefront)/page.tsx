import { LandingPage } from "@/components/landing/LandingPage";
import { getSession } from "@/lib/auth";
import { getPublicMerchants } from "@/lib/merchants/list-public";

export const metadata = {
  title: "SestaKıbrıs — Kıbrıs'ın günlük yaşam uygulaması",
  description:
    "Market, su, tüp ve kampüs siparişi. Hızlı teslimat, güvenli ödeme.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [session, { merchants, error }] = await Promise.all([
    getSession(),
    getPublicMerchants(),
  ]);

  return (
    <LandingPage merchants={merchants} error={error} session={session} />
  );
}
