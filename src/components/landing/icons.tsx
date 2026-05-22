/** Minimal outline icons for category pills */
export function CategoryIcon({ type }: { type: string }) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "water":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#5BB6FF" strokeWidth="2">
          <path d="M12 2.5c3 4 6 7.5 6 11a6 6 0 1 1-12 0c0-3.5 3-7 6-11z" />
        </svg>
      );
    case "gas":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2">
          <rect x="8" y="4" width="8" height="16" rx="2" />
        </svg>
      );
    case "campus":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#101828" strokeWidth="2">
          <path d="M4 20V8l8-4 8 4v12" />
        </svg>
      );
    case "shop":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2">
          <path d="M4 10h16l-1.5 10H5.5L4 10z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#101828" strokeWidth="2">
          <path d="M4 7h16v13H4z" />
        </svg>
      );
  }
}
