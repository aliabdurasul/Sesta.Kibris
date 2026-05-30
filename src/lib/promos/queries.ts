/**
 * Public homepage promo queries — active, in-schedule, sorted.
 */
import { createServerClient } from "@/lib/supabase/server";
import { resolvePromoImageUrl } from "@/lib/storage/promo-banner";
import { log } from "@/lib/logger";
import type { HomepagePromoSlide } from "@/types/promo";

type PromoListRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string;
  sort_order: number;
  market_id: string;
};

/** Active promos for homepage slider (RLS enforces schedule + market active). */
export async function getActiveHomepagePromoSlides(): Promise<HomepagePromoSlide[]> {
  try {
    const supabase = await createServerClient();
    const { data: promos, error } = await supabase
      .from("homepage_promos")
      .select("id, title, subtitle, image_url, cta_text, sort_order, market_id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      log.error("promos.public.fetch", {
        reason: error.message,
        code: error.code,
      });
      return [];
    }

    const rows = (promos ?? []) as PromoListRow[];
    if (!rows.length) return [];

    const marketIds = [...new Set(rows.map((p) => p.market_id))];
    const { data: merchants, error: merchantError } = await supabase
      .from("merchants")
      .select("id, slug")
      .in("id", marketIds);

    if (merchantError) {
      log.error("promos.public.merchants", {
        reason: merchantError.message,
      });
      return [];
    }

    const merchantRows = (merchants ?? []) as { id: string; slug: string }[];
    const slugByMarketId = new Map(
      merchantRows.map((m) => [m.id, m.slug] as const),
    );

    const slides: HomepagePromoSlide[] = [];
    for (const row of rows) {
      const slug = slugByMarketId.get(row.market_id);
      if (!slug) continue;
      slides.push({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle?.trim() || "",
        imageUrl: resolvePromoImageUrl(row.image_url),
        cta: row.cta_text?.trim() || "Keşfet",
        href: `/market/${slug}`,
      });
    }

    return slides;
  } catch (err) {
    log.error("promos.public.fetch.unexpected", {
      reason: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
