import type { NavItem } from "@/lib/ui/nav-config";

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.href.startsWith("/#")) {
    return pathname === "/" || item.matchPrefixes.some((p) => pathname.startsWith(p));
  }
  return item.matchPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p),
  );
}
