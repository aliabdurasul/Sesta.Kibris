"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HomepagePromoSlide } from "@/types/promo";

const AUTO_MS = 5500;
const SWIPE_THRESHOLD_PX = 48;

/**
 * Mobile-first homepage promo carousel.
 * Swipeable on touch; auto-advances; links to /market/[slug].
 */
export function PromoHeroSlider({ slides }: { slides: HomepagePromoSlide[] }) {
  if (slides.length === 0) {
    return null;
  }

  return <PromoHeroSliderInner slides={slides} />;
}

function PromoHeroSliderInner({ slides }: { slides: HomepagePromoSlide[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const paused = useRef(false);

  const goTo = useCallback(
    (next: number) => {
      setIndex((next + slides.length) % slides.length);
    },
    [slides.length],
  );

  const advance = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  useEffect(() => {
    if (paused.current || slides.length <= 1) return;
    const t = setInterval(advance, AUTO_MS);
    return () => clearInterval(t);
  }, [advance, slides.length]);

  const slide = slides[index]!;

  const onTouchStart = (e: React.TouchEvent) => {
    paused.current = true;
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    const endX = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    window.setTimeout(() => {
      paused.current = false;
    }, AUTO_MS);

    if (start == null || endX == null) return;
    const delta = endX - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goTo(index + 1);
    else goTo(index - 1);
  };

  return (
    <section className="px-4" aria-label="Kampanyalar">
      <div
        className="relative touch-pan-y overflow-hidden rounded-[1.125rem] shadow-[0_4px_20px_rgba(16,24,40,0.08)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Link href={slide.href} className="group block">
          <div className="relative aspect-video w-full overflow-hidden bg-brand-navy">
            {slide.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-active:scale-[1.02]"
              />
            ) : (
              <div
                className="absolute inset-0 bg-gradient-to-br from-brand-navy via-accent-strong/80 to-accent"
                aria-hidden
              />
            )}

            <div
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10"
              aria-hidden
            />

            <div className="relative flex h-full flex-col justify-end p-4 pb-5 text-white">
              <h2 className="text-lg font-bold leading-tight drop-shadow-sm sm:text-xl">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="mt-1 line-clamp-2 text-sm text-white/90">
                  {slide.subtitle}
                </p>
              )}
              <span className="mt-3 inline-flex w-fit items-center rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition group-active:bg-white">
                {slide.cta} →
              </span>
            </div>
          </div>
        </Link>
      </div>

      {slides.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Kampanya ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${
                i === index ? "h-1.5 w-5 bg-accent" : "h-1.5 w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
