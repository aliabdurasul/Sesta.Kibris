import Link from "next/link";
import Image from "next/image";
import type { SessionUser } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/auth";

interface HomeHeaderProps {
  session: SessionUser | null;
  /** UI slot for admin-approved promos — wire to CMS later */
  promoText?: string | null;
}

function NavIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-app-bg text-brand-navy transition-colors active:bg-brand-sky/15"
    >
      {children}
    </Link>
  );
}

export function HomeHeader({ session, promoText }: HomeHeaderProps) {
  const profileHref = session ? getRoleHomePath(session.role) : "/auth/login";
  const ordersHref = session ? "/customer/orders" : "/auth/login";

  return (
    <header className="sticky top-0 z-40 bg-brand-white">
      {promoText && (
        <div className="bg-gradient-to-r from-brand-orange to-amber-500 px-4 py-2 text-center text-xs font-semibold text-white">
          {promoText}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/favicon.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5"
          />
          <span className="truncate text-lg font-bold tracking-tight text-brand-navy">
            SestaKıbrıs
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <NavIcon href={ordersHref} label="Bildirimler">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </NavIcon>
          <NavIcon href={profileHref} label="Hesabım">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </NavIcon>
        </div>
      </div>
    </header>
  );
}
