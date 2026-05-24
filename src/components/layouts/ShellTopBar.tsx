"use client";

export function ShellTopBar({
  title,
  subtitle,
  headerActions,
  onMenuOpen,
}: {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  onMenuOpen: () => void;
}) {
  return (
    <header className="shell-topbar sticky top-0 z-30 border-b border-border bg-brand-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 lg:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-text-secondary ring-1 ring-border md:inline-flex lg:hidden"
            aria-label="Menüyü aç"
            onClick={onMenuOpen}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            {subtitle && (
              <p className="hidden text-xs font-medium uppercase tracking-wide text-text-muted sm:block">
                {subtitle}
              </p>
            )}
            <h1 className="truncate text-base font-bold text-brand-navy md:text-lg">
              {title}
            </h1>
          </div>
        </div>
        {headerActions && (
          <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
        )}
      </div>
    </header>
  );
}
