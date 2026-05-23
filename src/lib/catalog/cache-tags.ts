export function catalogProductTag(id: string) {
  return `global-product-${id}`;
}
export function catalogCategoryTag(id: string) {
  return `catalog-category-${id}`;
}
export const CATALOG_ALL_TAG = "catalog-all";
export const SUGGESTIONS_TAG = "catalog-suggestions";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "urun";
}
