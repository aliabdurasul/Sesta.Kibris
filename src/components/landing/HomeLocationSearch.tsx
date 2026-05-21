export function HomeLocationSearch() {
  return (
    <section className="space-y-3 px-4">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-brand-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm ring-1 ring-black/5 transition-transform active:scale-[0.98]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="2">
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        Lefkoşa
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <label className="relative block">
        <span className="sr-only">Ara</span>
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
        <input
          type="search"
          placeholder="Market, ürün veya kategori ara..."
          className="w-full rounded-[1.25rem] border-0 bg-brand-white py-4 pl-12 pr-4 text-sm text-text-primary shadow-[0_4px_24px_rgba(11,42,111,0.08)] ring-1 ring-black/5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
        />
      </label>
    </section>
  );
}
