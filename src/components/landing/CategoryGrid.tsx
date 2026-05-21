import Link from "next/link";

export const MARKET_CATEGORIES = [
  { id: "grocery", label: "Süpermarketler", icon: "🛒", filter: "grocery" },
  { id: "restaurant", label: "Restoranlar", icon: "🍽️", filter: "restaurant" },
  { id: "cafe", label: "Kafeler", icon: "☕", filter: "cafe" },
  { id: "local", label: "Yerel Dükkanlar", icon: "🏪", filter: "local" },
  { id: "pharmacy", label: "Eczane", icon: "💊", filter: "pharmacy" },
  { id: "electronics", label: "Elektronik", icon: "📱", filter: "electronics" },
] as const;

export function CategoryGrid() {
  return (
    <section id="categories" className="scroll-mt-24">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Kategoriler</h2>
          <p className="text-sm text-gray-500">İhtiyacına göre keşfet</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {MARKET_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/?category=${cat.filter}#browse-markets`}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center shadow-sm ring-1 ring-gray-100 transition-all hover:ring-sesta-blue/40 active:scale-[0.98]"
          >
            <span className="text-2xl" aria-hidden>
              {cat.icon}
            </span>
            <span className="text-xs font-medium leading-tight text-gray-800">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
