/**
 * Courier dashboard loading skeleton.
 * Shown while the courier page server component loads deliveries.
 */
export default function CourierLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-6 w-48 rounded-lg bg-gray-200" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="mb-3 rounded-xl bg-gray-50 p-3">
              <div className="h-3 w-20 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-32 rounded bg-gray-300" />
              <div className="mt-1 h-3 w-48 rounded bg-gray-200" />
            </div>
            <div className="h-12 w-full rounded-xl bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
