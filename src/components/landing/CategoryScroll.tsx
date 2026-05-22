"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SESTA_CATEGORIES } from "@/lib/landing/categories";

const pillBase =
  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors";

function pillClass(active: boolean) {
  if (active) {
    return `${pillBase} bg-accent-soft text-accent-strong ring-1 ring-accent/40`;
  }
  return `${pillBase} bg-brand-white text-text-secondary ring-1 ring-border`;
}

export function CategoryScroll() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category");

  return (
    <section id="categories" className="space-y-2.5">
      <h2 className="px-4 text-[15px] font-semibold text-brand-navy">
        Kategoriler
      </h2>
      <div className="flex gap-2 overflow-x-auto px-4 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/#browse-markets" className={pillClass(!active)}>
          Tümü
        </Link>
        {SESTA_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/?category=${cat.filter}#browse-markets`}
            className={pillClass(active === cat.filter)}
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
