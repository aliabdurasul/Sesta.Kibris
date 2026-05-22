export type PromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
};

export function buildPromoSlidesFromMerchants(
  merchants: { id: string; name: string; slug: string; category?: string }[],
): PromoSlide[] {
  return merchants.slice(0, 2).map((m) => ({
    id: m.id,
    title: m.name,
    subtitle:
      m.category === "water" ? "Su siparişi — hızlı teslimat" : "Günlük market alışverişi",
    cta: "Keşfet",
    href: `/merchants/${m.slug}`,
  }));
}
