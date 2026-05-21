import { LandingPage } from "@/components/landing/LandingPage";
import { getPublicMerchants } from "@/lib/merchants/list-public";

export const metadata = {
  title: "SestaKıbrıs — Kıbrıs'ın Sepeti",
  description:
    "Kıbrıs'ın Sepeti — yerel marketlerden çevrimiçi sipariş ve hızlı teslimat.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { merchants, error } = await getPublicMerchants();
  return <LandingPage merchants={merchants} error={error} />;
}
