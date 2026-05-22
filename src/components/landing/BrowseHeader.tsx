import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/auth";

interface BrowseHeaderProps {
  session: SessionUser | null;
}

export function BrowseHeader({ session }: BrowseHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-brand-white px-4 pb-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-[17px] font-bold tracking-tight text-brand-navy"
        >
          SestaKıbrıs
        </Link>

        {session ? (
          <Link
            href={getRoleHomePath(session.role)}
            className="text-sm font-semibold text-brand-navy"
          >
            Hesabım
          </Link>
        ) : (
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <Link
              href="/auth/login"
              className="font-semibold text-brand-navy"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="font-medium text-text-muted"
            >
              Kayıt Ol
            </Link>
          </div>
        )}
      </div>

      <button
        type="button"
        className="mt-2.5 flex items-center gap-1 text-sm font-semibold text-brand-navy"
      >
        Lefkoşa
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <label className="relative mt-3 block">
        <span className="sr-only">Ara</span>
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
        <input
          type="search"
          placeholder="Market, ürün ara..."
          className="w-full rounded-[1.25rem] border border-border bg-app-bg py-3 pl-10 pr-4 text-sm text-brand-navy placeholder:text-text-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
      </label>
    </header>
  );
}
