/**
 * Admin dashboard loading skeleton.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
            <div className="h-8 w-10 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="mb-3 h-5 w-40 rounded bg-gray-200" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div className="space-y-1">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
