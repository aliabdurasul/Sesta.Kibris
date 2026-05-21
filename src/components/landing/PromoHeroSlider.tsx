"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type PromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  tag?: string;
};

const DEFAULT_SLIDES: PromoSlide[] = [
  {
    id: "alkmar",
    title: "Alkmar Market",
    subtitle: "Taze gıda, su ve günlük ihtiyaçlar — kapına teslim.",
    cta: "Keşfet",
    href: "#browse-markets",
    tag: "Sponsorlu",
  },
  {
    id: "sesta-pack",
    title: "SestaKıbrıs Market Paketi",
    subtitle: "Süt, ekmek, yumurta ve sebze — tek siparişte.",
    cta: "Keşfet",
    href: "#browse-markets",
    tag: "Öne Çıkan",
  },
  {
    id: "water",
    title: "Su siparişi",
    subtitle: "Damacana ve şişe su — hızlı teslimat.",
    cta: "Keşfet",
    href: "/?category=water#browse-markets",
    tag: "Kampanya",
  },
];

const AUTO_MS = 4500;

export function PromoHeroSlider({ slides }: { slides: PromoSlide[] }) {
  const items = slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    const t = setInterval(advance, AUTO_MS);
    return () => clearInterval(t);
  }, [advance]);

  const slide = items[index]!;

  return (
    <section className="px-4" aria-label="Kampanyalar">
      <div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_12px_40px_rgba(255,122,0,0.22)]">
        <Link
          href={slide.href}
          className="block min-h-[168px] bg-gradient-to-br from-brand-orange via-[#ff8f2e] to-amber-400 p-5 text-white transition-transform active:scale-[0.99]"
        >
          {slide.tag && (
            <span className="inline-flex rounded-full bg-brand-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
              {slide.tag}
            </span>
          )}
          <h3 className="mt-2 text-xl font-bold leading-tight">{slide.title}</h3>
          <p className="mt-1.5 max-w-[90%] text-sm leading-snug text-white/90">
            {slide.subtitle}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-white px-4 py-2 text-sm font-bold text-brand-orange shadow-md">
            {slide.cta}
            <span aria-hidden>→</span>
          </span>

          {/* Decorative grocery silhouettes */}
          <div className="pointer-events-none absolute -bottom-2 -right-2 flex gap-1 opacity-30" aria-hidden>
            <div className="h-16 w-12 rounded-lg bg-white/40" />
            <div className="h-20 w-14 rounded-lg bg-white/50" />
            <div className="h-14 w-10 rounded-full bg-white/35" />
          </div>
        </Link>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {items.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Kampanya ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-brand-orange" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

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
