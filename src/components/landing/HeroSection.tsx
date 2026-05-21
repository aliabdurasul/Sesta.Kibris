import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-sesta-navy px-6 py-10 text-white shadow-lg">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sesta-blue/30 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-sesta-orange/25 blur-2xl"
        aria-hidden
      />

      <p className="text-xs font-semibold uppercase tracking-widest text-sesta-blue">
        Kıbrıs&apos;ın Sepeti
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">SestaKıbrıs</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
        Yerel marketlerden sipariş ver, kapına kadar teslim al. Güvenli ödeme,
        doğrulanmış işletmeler.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="#browse-markets"
          className="inline-flex items-center justify-center rounded-xl bg-sesta-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sesta-orange/90"
        >
          Marketleri Keşfet
        </Link>
        <Link
          href="#categories"
          className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/15"
        >
          Kategorilere Göz At
        </Link>
      </div>
    </section>
  );
}
