import Link from "next/link";
import Image from "next/image";

interface MerchantCardProps {
  merchant: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    average_delivery_minutes: number | null;
    minimum_order_amount: number | null;
  };
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  const minOrder = merchant.minimum_order_amount
    ? `Min. ${(merchant.minimum_order_amount / 100).toFixed(0)} ₺`
    : null;

  const deliveryTime = merchant.average_delivery_minutes
    ? `~${merchant.average_delivery_minutes} dk`
    : null;

  return (
    <Link
      href={`/merchants/${merchant.slug}`}
      className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md active:bg-gray-50"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {merchant.logo_url ? (
          <Image
            src={merchant.logo_url}
            alt={merchant.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">
            🏪
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-gray-900">
          {merchant.name}
        </h2>
        {merchant.description && (
          <p className="mt-0.5 truncate text-sm text-gray-500">
            {merchant.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          {deliveryTime && <span>🕐 {deliveryTime}</span>}
          {minOrder && <span>{minOrder}</span>}
        </div>
      </div>

      <span className="flex-shrink-0 text-gray-300">›</span>
    </Link>
  );
}
