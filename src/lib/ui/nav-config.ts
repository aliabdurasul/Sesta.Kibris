/**
 * Unified navigation — same structure for sidebar + bottom nav.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  matchPrefixes: string[];
  /** Only exact href match (e.g. /admin home) */
  exact?: boolean;
  /** Consumer tab icon key for SVG rendering */
  tabIcon?: "home" | "markets" | "search" | "cart" | "orders";
  showCartBadge?: boolean;
}

export function consumerNav(ordersHref: string): NavItem[] {
  return [
    {
      href: "/",
      label: "Ana",
      icon: "🏠",
      tabIcon: "home",
      matchPrefixes: ["/"],
      exact: true,
    },
    {
      href: "/#browse-markets",
      label: "Marketler",
      icon: "🏪",
      tabIcon: "markets",
      matchPrefixes: ["/market/", "/merchants"],
    },
    {
      href: "/catalog",
      label: "Ara",
      icon: "🔍",
      tabIcon: "search",
      matchPrefixes: ["/catalog"],
    },
    {
      href: "/checkout",
      label: "Sepet",
      icon: "🛒",
      tabIcon: "cart",
      matchPrefixes: ["/checkout"],
      showCartBadge: true,
    },
    {
      href: ordersHref,
      label: "Siparişler",
      icon: "📋",
      tabIcon: "orders",
      matchPrefixes: ["/order/", "/orders/", "/customer/orders"],
    },
  ];
}

export function adminNav(): NavItem[] {
  return [
    {
      href: "/admin",
      label: "Panel",
      icon: "📊",
      matchPrefixes: ["/admin"],
      exact: true,
    },
    {
      href: "/admin/orders",
      label: "Siparişler",
      icon: "📋",
      matchPrefixes: ["/admin/orders"],
    },
    {
      href: "/admin/catalog",
      label: "Ürünler",
      icon: "🍽️",
      matchPrefixes: ["/admin/catalog"],
    },
    {
      href: "/admin/actors",
      label: "Aktörler",
      icon: "👥",
      matchPrefixes: ["/admin/actors"],
    },
    {
      href: "/admin/catalog/categories",
      label: "Ayarlar",
      icon: "⚙️",
      matchPrefixes: ["/admin/catalog/categories", "/admin/catalog/suggestions"],
    },
  ];
}

export function merchantNav(marketSlug: string): NavItem[] {
  const marketBase = `/market/${marketSlug}`;
  return [
    {
      href: marketBase,
      label: "Siparişler",
      icon: "📋",
      matchPrefixes: [marketBase],
    },
    {
      href: "/merchant/products",
      label: "Ürünler",
      icon: "🍽️",
      matchPrefixes: ["/merchant/products"],
    },
    {
      href: "/merchant/products/browse",
      label: "Envanter",
      icon: "📦",
      matchPrefixes: ["/merchant/products/browse"],
    },
    {
      href: "/merchant/profile",
      label: "Ayarlar",
      icon: "⚙️",
      matchPrefixes: ["/merchant/profile"],
    },
  ];
}

export function courierNav(): NavItem[] {
  return [
    {
      href: "/courier",
      label: "Teslimatlar",
      icon: "🛵",
      matchPrefixes: ["/courier"],
      exact: true,
    },
  ];
}

export type AppRole = "consumer" | "admin" | "merchant" | "courier";

export function navForRole(
  role: AppRole,
  opts?: { ordersHref?: string; marketSlug?: string },
): NavItem[] {
  switch (role) {
    case "consumer":
      return consumerNav(opts?.ordersHref ?? "/orders/guest");
    case "admin":
      return adminNav();
    case "merchant":
      if (!opts?.marketSlug) return merchantNav("");
      return merchantNav(opts.marketSlug);
    case "courier":
      return courierNav();
  }
}

/** @deprecated use consumerNav */
export function storefrontTabs(ordersHref: string): NavItem[] {
  return consumerNav(ordersHref);
}
