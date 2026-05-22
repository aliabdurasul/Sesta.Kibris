"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PromoSlide } from "@/lib/landing/promo-slides";

const DEFAULT_SLIDES: PromoSlide[] = [
  {
    id: "promo-20",
    title: "%20 indirim",
    subtitle: "Yerel marketlerde bugün",
    cta: "Keşfet",
    href: "#browse-markets",
  },
];

const AUTO_MS = 6000;

export function PromoHeroSlider({ slides }: { slides: PromoSlide[] }) {
  const items =
    slides.length > 0 ? [DEFAULT_SLIDES[0]!, ...slides.slice(0, 2)] : DEFAULT_SLIDES;
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
      <Link
        href={slide.href}
        className="block rounded-[1.125rem] border border-border bg-brand-white px-4 py-3.5 shadow-[0_2px_8px_rgba(16,24,40,0.04)] transition-colors active:bg-accent-soft/50"
      >
        <p className="text-[13px] font-semibold text-accent-strong">
          {slide.title}
        </p>
        <p className="mt-0.5 text-sm text-text-secondary">{slide.subtitle}</p>
        <span className="mt-2 inline-block text-sm font-semibold text-brand-navy">
          {slide.cta} →
        </span>
      </Link>

      {items.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {items.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Kampanya ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${
                i === index ? "h-1.5 w-4 bg-accent" : "h-1.5 w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
