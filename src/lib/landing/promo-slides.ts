export type PromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  tag?: string;
};

export function buildPromoSlidesFromMerchants(
  merchants: { id: string; name: string; slug: string; category?: string }[],
): PromoSlide[] {
  return merchants.slice(0, 3).map((m, i) => ({
    id: m.id,
    title: m.name,
    subtitle:
      m.category === "water"
        ? "Su ve içecek siparişi — hızlı teslimat."
        : "Günlük ihtiyaçlar — SestaKıbrıs ile kapına gelsin.",
    cta: "Keşfet",
    href: `/merchants/${m.slug}`,
    tag: i === 0 ? "Sponsorlu" : "Öne Çıkan",
  }));
}
