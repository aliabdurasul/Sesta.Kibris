/**
 * Navigation config for dashboard shells — merchant vs admin.
 */

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: string;
  /** Path prefixes that mark this item active */
  matchPrefixes: string[];
}

export function adminNavItems(): DashboardNavItem[] {
  return [
    {
      href: "/admin",
      label: "Panel",
      icon: "📊",
      matchPrefixes: ["/admin"],
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

export function merchantNavItems(marketSlug: string): DashboardNavItem[] {
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

/** Customer storefront bottom tabs — mobile marketplace. */
export interface StorefrontTab {
  href: string;
  label: string;
  icon: "home" | "markets" | "search" | "cart" | "orders";
  matchPrefixes: string[];
}

export function storefrontTabs(ordersHref: string): StorefrontTab[] {
  return [
    { href: "/", label: "Ana", icon: "home", matchPrefixes: ["/"] },
    {
      href: "/#browse-markets",
      label: "Marketler",
      icon: "markets",
      matchPrefixes: ["/market/", "/merchants"],
    },
    {
      href: "/catalog",
      label: "Ara",
      icon: "search",
      matchPrefixes: ["/catalog"],
    },
    {
      href: "/checkout",
      label: "Sepet",
      icon: "cart",
      matchPrefixes: ["/checkout"],
    },
    {
      href: ordersHref,
      label: "Siparişler",
      icon: "orders",
      matchPrefixes: ["/order/", "/orders/", "/customer/orders"],
    },
  ];
}
