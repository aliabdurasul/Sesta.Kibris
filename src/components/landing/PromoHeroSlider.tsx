"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PromoSlide } from "@/lib/landing/promo-slides";

const DEFAULT_SLIDES: PromoSlide[] = [
  {
    id: "promo-20",
    title: "%20 İNDİRİM",
    subtitle: "Yerel marketlerde bugün",
    cta: "Keşfet",
    href: "#browse-markets",
  },
  {
    id: "alkmar",
    title: "Alkmar Market",
    subtitle: "Taze gıda — kapına teslim",
    cta: "Keşfet",
    href: "#browse-markets",
  },
];

const AUTO_MS = 5000;

export function PromoHeroSlider({ slides }: { slides: PromoSlide[] }) {
  const items =
    slides.length > 0
      ? [{ ...DEFAULT_SLIDES[0]! }, ...slides.slice(0, 2)]
      : DEFAULT_SLIDES;
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
        className="flex min-h-[104px] items-center justify-between gap-4 rounded-[1.25rem] bg-gradient-to-r from-brand-orange to-[#ff8a4c] px-5 py-4 shadow-[0_6px_20px_rgba(255,107,44,0.22)] transition-transform active:scale-[0.99]"
      >
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight text-white">
            {slide.title}
          </p>
          <p className="mt-0.5 text-sm text-white/90">{slide.subtitle}</p>
          <span className="mt-2.5 inline-flex items-center gap-1 text-sm font-bold text-white">
            {slide.cta} →
          </span>
        </div>
      </Link>

      <div className="mt-2.5 flex justify-center gap-1.5">
        {items.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Kampanya ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`rounded-full transition-all ${
              i === index
                ? "h-1.5 w-4 bg-brand-orange"
                : "h-1.5 w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
