const BENEFITS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2A6F" strokeWidth="1.75">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      </svg>
    ),
    title: "Güvenli ödeme",
    description: "Stripe ile korunan ödeme",
    bg: "bg-brand-sky/10",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="1.75">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    title: "Doğrulanmış işletmeler",
    description: "Onaylı yerel marketler",
    bg: "bg-brand-orange/10",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2A6F" strokeWidth="1.75">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" />
      </svg>
    ),
    title: "Haftalık ödemeler",
    description: "İşletmelere düzenli ödeme",
    bg: "bg-emerald-50",
  },
] as const;

export function TrustBenefits() {
  return (
    <section className="space-y-3 px-4">
      <h2 className="text-base font-bold text-text-primary">Neden SestaKıbrıs?</h2>
      <div className="grid grid-cols-3 gap-2">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className={`rounded-2xl ${b.bg} px-2.5 py-3 text-center ring-1 ring-black/[0.03]`}
          >
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-white shadow-sm">
              {b.icon}
            </div>
            <p className="mt-2 text-[10px] font-bold leading-tight text-text-primary">
              {b.title}
            </p>
            <p className="mt-0.5 text-[9px] leading-snug text-text-muted">{b.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
