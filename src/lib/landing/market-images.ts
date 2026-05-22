/**
 * Market card cover photos — /public/images/markets/
 *
 * grocery.jpg    — yerel üretici / taze gıda reyonu
 * grocery-2.jpg  — market koridoru (paketli ürünler)
 */

const GROCERY_PRODUCE = "/images/markets/grocery.jpg";
const GROCERY_AISLE = "/images/markets/grocery-2.jpg";

const DEFAULT = GROCERY_PRODUCE;

/** Market & yerel dükkan — iki foto arasında dönüşümlü */
const MARKET_VARIANTS = [GROCERY_PRODUCE, GROCERY_AISLE] as const;

/** Diğer kategoriler — aynı stok fotoğraflar (yeni görsel eklenene kadar) */
const BY_CATEGORY: Record<string, string> = {
  grocery: GROCERY_PRODUCE,
  local: GROCERY_PRODUCE,
  water: GROCERY_AISLE,
  gas: GROCERY_AISLE,
  campus: GROCERY_AISLE,
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getMarketCoverImage(
  category: string | undefined,
  merchantId: string,
): string {
  if (category === "grocery" || category === "local" || !category) {
    return MARKET_VARIANTS[hashId(merchantId) % MARKET_VARIANTS.length]!;
  }
  return BY_CATEGORY[category] ?? DEFAULT;
}
