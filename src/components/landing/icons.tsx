/** Minimal outline icons for category cards */
export function CategoryIcon({ type }: { type: string }) {
  const cls = "h-7 w-7";
  switch (type) {
    case "water":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#4DA6FF" strokeWidth="1.75">
          <path d="M12 2.5c3 4 6 7.5 6 11a6 6 0 1 1-12 0c0-3.5 3-7 6-11z" />
        </svg>
      );
    case "gas":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="1.75">
          <rect x="8" y="4" width="8" height="16" rx="2" />
          <path d="M10 8h4M10 12h4" />
        </svg>
      );
    case "campus":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#0B2A6F" strokeWidth="1.75">
          <path d="M4 20V8l8-4 8 4v12" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "shop":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="1.75">
          <path d="M4 10h16l-1.5 10H5.5L4 10z" />
          <path d="M8 10V6a4 4 0 0 1 8 0v4" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#0B2A6F" strokeWidth="1.75">
          <path d="M4 7h16v13H4z" />
          <path d="M8 7V5a2 2 0 0 1 4 0v2" />
        </svg>
      );
  }
}
