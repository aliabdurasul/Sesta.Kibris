/**
 * Storefront loading skeleton.
 * Shown during server component rendering for /merchants and /merchants/[slug].
 */
export default function StorefrontLoading() {
  return (
    <div className="animate-pulse">
      {/* Header shimmer is handled by layout — this covers the main content area */}
      <div className="mb-4 h-7 w-32 rounded-lg bg-gray-200" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
              <div className="h-3 w-1/3 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
