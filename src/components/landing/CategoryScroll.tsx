"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SESTA_CATEGORIES } from "@/lib/landing/categories";
import { CategoryIcon } from "@/components/landing/icons";

export function CategoryScroll() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category");

  return (
    <section id="categories" className="space-y-2.5">
      <h2 className="px-4 text-[15px] font-bold text-brand-navy">Kategoriler</h2>
      <div className="flex gap-2 overflow-x-auto px-4 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/#browse-markets"
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all ${
            !active
              ? "bg-brand-orange text-white shadow-sm"
              : "bg-brand-white text-text-secondary ring-1 ring-border"
          }`}
        >
          Tümü
        </Link>
        {SESTA_CATEGORIES.map((cat) => {
          const isActive = active === cat.filter;
          return (
            <Link
              key={cat.id}
              href={`/?category=${cat.filter}#browse-markets`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-orange-soft text-brand-orange ring-1 ring-brand-orange/30"
                  : "bg-brand-white text-text-secondary ring-1 ring-border"
              }`}
            >
              <CategoryIcon type={cat.icon} />
              {cat.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
