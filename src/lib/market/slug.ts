/**
 * SEO slug utilities for marketplace URLs (/market/:slug).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const TURKISH_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  I: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

/** Legacy admin suffix: slugify(name)-{base36 timestamp} */
const LEGACY_SUFFIX_RE = /^(.+)-[a-z0-9]{6,12}$/;

export function normalizeTurkish(text: string): string {
  let out = text.toLocaleLowerCase("tr");
  for (const [from, to] of Object.entries(TURKISH_MAP)) {
    out = out.split(from).join(to);
  }
  return out;
}

export function slugifyMarketName(name: string): string {
  const normalized = normalizeTurkish(name.trim());
  return normalized
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Strip random base36 suffix from legacy hybrid slugs (migration / redirect only). */
export function stripLegacySlugSuffix(slug: string): string | null {
  const m = slug.match(LEGACY_SUFFIX_RE);
  if (!m?.[1]) return null;
  const base = m[1].replace(/-+$/, "");
  return base.length > 0 ? base : null;
}

function isSlugTaken(
  slug: string,
  taken: Set<string>,
): boolean {
  return taken.has(slug);
}

/** Pick first free slug: base, base-1, base-2, … */
export function pickUniqueSlug(baseSlug: string, taken: Set<string>): string {
  if (!baseSlug) return "market";
  if (!isSlugTaken(baseSlug, taken)) return baseSlug;
  let n = 1;
  while (isSlugTaken(`${baseSlug}-${n}`, taken)) {
    n += 1;
  }
  return `${baseSlug}-${n}`;
}

export async function resolveUniqueSlug(
  admin: SupabaseClient<Database>,
  baseSlug: string,
): Promise<string> {
  const safeBase = baseSlug || "market";
  const { data: rows } = await admin.from("merchants").select("slug");
  const taken = new Set(
    ((rows ?? []) as { slug: string }[]).map((r) => r.slug),
  );
  const { data: aliasRows } = await admin
    .from("merchant_slug_redirects")
    .select("old_slug");
  for (const row of (aliasRows ?? []) as { old_slug: string }[]) {
    taken.add(row.old_slug);
  }
  return pickUniqueSlug(safeBase, taken);
}
