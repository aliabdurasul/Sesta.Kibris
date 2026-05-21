"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SESTA_CATEGORIES } from "@/lib/landing/categories";
import { CategoryIcon } from "@/components/landing/icons";

export function CategoryScroll() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category");

  return (
    <section className="space-y-3">
      <h2 className="px-4 text-base font-bold text-text-primary">Kategoriler</h2>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SESTA_CATEGORIES.map((cat) => {
          const isActive = active === cat.filter;
          return (
            <Link
              key={cat.id}
              href={`/?category=${cat.filter}#browse-markets`}
              className={`flex w-[4.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl bg-brand-white p-3 shadow-[0_4px_16px_rgba(11,42,111,0.06)] ring-1 transition-all active:scale-95 ${
                isActive
                  ? "ring-brand-orange shadow-[0_0_0_3px_rgba(255,122,0,0.2)]"
                  : "ring-black/5"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  isActive ? "bg-brand-orange/10" : "bg-app-bg"
                }`}
              >
                <CategoryIcon type={cat.icon} />
              </div>
              <span className="text-center text-[11px] font-semibold leading-tight text-text-secondary">
                {cat.label}
              </span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
