/** Core SestaKibris categories — UI filters map to `merchants.category`. */
export const SESTA_CATEGORIES = [
  {
    id: "market",
    label: "Market",
    filter: "grocery",
    icon: "market",
  },
  {
    id: "local",
    label: "Yerel Dükkanlar",
    filter: "local",
    icon: "shop",
  },
  {
    id: "water",
    label: "Su",
    filter: "water",
    icon: "water",
  },
  {
    id: "gas",
    label: "Tüp",
    filter: "gas",
    icon: "gas",
  },
  {
    id: "campus",
    label: "Kampüs",
    filter: "campus",
    icon: "campus",
  },
] as const;

export function getCategoryLabel(filter: string | null): string | null {
  if (!filter) return null;
  return SESTA_CATEGORIES.find((c) => c.filter === filter)?.label ?? null;
}
