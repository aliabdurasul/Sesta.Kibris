/**
 * Merchant dashboard loading skeleton.
 * Shown while the merchant page server component loads orders.
 */
export default function MerchantLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-6 w-40 rounded-lg bg-gray-200" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="space-y-1">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>
              <div className="h-6 w-20 rounded-full bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-2/3 rounded bg-gray-100" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-10 flex-1 rounded-xl bg-gray-200" />
              <div className="h-10 flex-1 rounded-xl bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
