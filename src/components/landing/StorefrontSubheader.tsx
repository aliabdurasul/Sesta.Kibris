import Link from "next/link";

/** Compact header for merchant / checkout pages (home has its own chrome). */
export function StorefrontSubheader({
  title,
  backHref = "/",
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-brand-white px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-app-bg text-brand-navy"
          aria-label="Geri"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="truncate text-base font-bold text-brand-navy">{title}</h1>
      </div>
    </header>
  );
}
