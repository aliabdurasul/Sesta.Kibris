"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type FeaturedSlide = {
  id: string;
  title: string;
  description: string;
  badge: "Öne Çıkan" | "Sponsorlu";
  href: string;
};

const UI_PLACEHOLDER_SLIDES: FeaturedSlide[] = [
  {
    id: "promo-1",
    title: "Haftanın Fırsatları",
    description: "Seçili marketlerde özel indirimler — yakında.",
    badge: "Sponsorlu",
    href: "#browse-markets",
  },
  {
    id: "promo-2",
    title: "Yeni İş Ortakları",
    description: "Kıbrıs genelinde yeni marketler platforma katılıyor.",
    badge: "Öne Çıkan",
    href: "#browse-markets",
  },
];

const AUTO_MS = 4000;

export function FeaturedAdsCarousel({ slides }: { slides: FeaturedSlide[] }) {
  const items = slides.length > 0 ? slides : UI_PLACEHOLDER_SLIDES;
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      setIndex((next + items.length) % items.length);
    },
    [items.length],
  );

  useEffect(() => {
    const timer = setInterval(() => goTo(index + 1), AUTO_MS);
    return () => clearInterval(timer);
  }, [index, goTo]);

  const slide = items[index]!;

  return (
    <section aria-label="Öne çıkan ve sponsorlu içerik" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Öne Çıkanlar</h2>
        <span className="text-xs font-medium text-gray-400">
          {index + 1} / {items.length}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <Link
          href={slide.href}
          className="block bg-gradient-to-br from-sesta-navy via-sesta-navy to-sesta-blue p-5 text-white shadow-md transition-opacity hover:opacity-95"
        >
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              slide.badge === "Sponsorlu"
                ? "bg-sesta-orange text-white"
                : "bg-white/20 text-white"
            }`}
          >
            {slide.badge}
          </span>
          <h3 className="mt-3 text-xl font-bold">{slide.title}</h3>
          <p className="mt-1 text-sm text-white/80">{slide.description}</p>
          <span className="mt-4 inline-flex text-sm font-medium text-sesta-orange">
            Keşfet →
          </span>
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Slayt ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index
                ? "w-6 bg-sesta-orange"
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
