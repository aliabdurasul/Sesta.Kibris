import Link from "next/link";

interface MerchantCardProps {
  merchant: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    is_open?: boolean;
    address?: string | null;
    phone?: string | null;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  grocery: "Market / Gıda",
  water: "Su",
  gas: "Gaz",
};

export function MerchantCard({ merchant }: MerchantCardProps) {
  const categoryLabel = merchant.category
    ? (CATEGORY_LABELS[merchant.category] ?? merchant.category)
    : null;

  return (
    <Link
      href={`/market/${merchant.slug}`}
      className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md active:bg-gray-50"
    >
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl text-gray-300">
        🏪
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate font-semibold text-gray-900">
            {merchant.name}
          </h2>
          {merchant.is_open !== undefined && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                merchant.is_open
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {merchant.is_open ? "Açık" : "Kapalı"}
            </span>
          )}
        </div>
        {categoryLabel && (
          <p className="mt-0.5 text-sm text-gray-500">{categoryLabel}</p>
        )}
        {merchant.address && (
          <p className="mt-1 truncate text-xs text-gray-400">
            {merchant.address}
          </p>
        )}
      </div>

      <span className="flex-shrink-0 text-gray-300">›</span>
    </Link>
  );
}
