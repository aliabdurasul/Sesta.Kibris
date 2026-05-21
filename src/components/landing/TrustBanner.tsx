const TRUST_ITEMS = [
  {
    icon: "🔒",
    title: "Güvenli ödeme",
    description: "Stripe ile güvenli ödeme",
  },
  {
    icon: "✓",
    title: "Doğrulanmış işletmeler",
    description: "Onaylı yerel marketler",
  },
  {
    icon: "📅",
    title: "Haftalık ödemeler",
    description: "İşletmelere düzenli ödeme",
  },
] as const;

export function TrustBanner() {
  return (
    <section
      aria-label="Güven göstergeleri"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {TRUST_ITEMS.map((item) => (
        <div
          key={item.title}
          className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sesta-navy/5 text-lg"
            aria-hidden
          >
            {item.icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
