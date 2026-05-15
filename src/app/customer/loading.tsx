/**
 * Customer area loading skeleton.
 * Shown during order list and order detail loading.
 */
export default function CustomerLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-6 w-32 rounded-lg bg-gray-200" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-3 w-36 rounded bg-gray-100" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-6 w-20 rounded-full bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
