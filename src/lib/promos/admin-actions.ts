/**
 * Admin server actions — homepage promo CRUD.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createAdminServerClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import {
  isRejectedImagePayload,
  isValidHttpUrl,
} from "@/lib/validation/http-url";
import { normalizeStoredPromoImageUrl } from "@/lib/storage/promo-banner";
import type {
  HomepagePromo,
  HomepagePromoFormData,
  HomepagePromoWithMarket,
} from "@/types/promo";

type ActionResult = { success: true } | { success: false; error: string };

function validatePromoForm(
  data: HomepagePromoFormData,
): { ok: true; payload: HomepagePromoFormData } | { ok: false; error: string } {
  if (!data.title.trim()) {
    return { ok: false, error: "Başlık zorunlu." };
  }
  if (!data.market_id) {
    return { ok: false, error: "Hedef market seçin." };
  }
  if (!data.image_url.trim()) {
    return { ok: false, error: "Kampanya görseli zorunlu." };
  }
  if (isRejectedImagePayload(data.image_url)) {
    return { ok: false, error: "Yalnızca yüklenen görsel URL kullanın." };
  }
  const imageUrl = normalizeStoredPromoImageUrl(data.image_url);
  if (!imageUrl && !isValidHttpUrl(data.image_url.trim())) {
    return { ok: false, error: "Geçerli bir görsel yükleyin." };
  }

  return {
    ok: true,
    payload: {
      ...data,
      title: data.title.trim(),
      subtitle: data.subtitle.trim(),
      image_url: imageUrl ?? data.image_url.trim(),
      cta_text: data.cta_text.trim() || "Keşfet",
      sort_order: Number.isFinite(data.sort_order) ? data.sort_order : 0,
    },
  };
}

function revalidatePromoSurfaces() {
  revalidatePath("/");
  revalidatePath("/admin/promos");
}

export async function adminListPromos(): Promise<HomepagePromoWithMarket[]> {
  const supabase = createAdminServerClient();

  const { data: promosRaw, error } = await supabase
    .from("homepage_promos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    log.error("promos.admin.list", { reason: error.message });
    return [];
  }

  const promos = (promosRaw ?? []) as HomepagePromo[];

  const { data: merchantsRaw } = await supabase
    .from("merchants")
    .select("id, name, slug");

  const merchants = (merchantsRaw ?? []) as {
    id: string;
    name: string;
    slug: string;
  }[];
  const marketById = new Map(
    merchants.map((m) => [m.id, { name: m.name, slug: m.slug }] as const),
  );

  return promos.map((promo) => {
    const m = marketById.get(promo.market_id);
    return {
      ...promo,
      market_name: m?.name ?? "—",
      market_slug: m?.slug ?? "",
    };
  });
}

export async function adminGetPromo(
  id: string,
): Promise<HomepagePromoWithMarket | null> {
  const supabase = createAdminServerClient();
  const { data: promoRaw, error } = await supabase
    .from("homepage_promos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !promoRaw) {
    if (error) log.error("promos.admin.get", { id, reason: error.message });
    return null;
  }

  const promo = promoRaw as HomepagePromo;

  const { data: merchantRaw } = await supabase
    .from("merchants")
    .select("name, slug")
    .eq("id", promo.market_id)
    .maybeSingle();

  const merchant = merchantRaw as { name: string; slug: string } | null;

  return {
    ...promo,
    market_name: merchant?.name ?? "—",
    market_slug: merchant?.slug ?? "",
  };
}

export async function adminListMerchantsForPromo(): Promise<
  { id: string; name: string; slug: string }[]
> {
  const supabase = createAdminServerClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, slug")
    .order("name");

  if (error) {
    log.error("promos.admin.merchants", { reason: error.message });
    return [];
  }

  return data ?? [];
}

export async function adminCreatePromo(
  data: HomepagePromoFormData,
): Promise<ActionResult> {
  const validated = validatePromoForm(data);
  if (!validated.ok) return { success: false, error: validated.error };

  const supabase = createAdminServerClient();
  const p = validated.payload;
  const { error } = await supabase.from("homepage_promos").insert({
    title: p.title,
    subtitle: p.subtitle || null,
    image_url: p.image_url,
    market_id: p.market_id,
    cta_text: p.cta_text,
    is_active: p.is_active,
    sort_order: p.sort_order,
  });

  if (error) {
    log.error("promos.admin.create", { reason: error.message });
    return { success: false, error: error.message };
  }

  revalidatePromoSurfaces();
  return { success: true };
}

export async function adminUpdatePromo(
  id: string,
  data: HomepagePromoFormData,
): Promise<ActionResult> {
  const validated = validatePromoForm(data);
  if (!validated.ok) return { success: false, error: validated.error };

  const supabase = createAdminServerClient();
  const p = validated.payload;
  const { error } = await supabase
    .from("homepage_promos")
    .update({
      title: p.title,
      subtitle: p.subtitle || null,
      image_url: p.image_url,
      market_id: p.market_id,
      cta_text: p.cta_text,
      is_active: p.is_active,
      sort_order: p.sort_order,
    })
    .eq("id", id);

  if (error) {
    log.error("promos.admin.update", { id, reason: error.message });
    return { success: false, error: error.message };
  }

  revalidatePromoSurfaces();
  return { success: true };
}

export async function adminSetPromoActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const supabase = createAdminServerClient();
  const { error } = await supabase
    .from("homepage_promos")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePromoSurfaces();
  return { success: true };
}

export async function adminDeletePromo(id: string): Promise<ActionResult> {
  const supabase = createAdminServerClient();
  const { error } = await supabase.from("homepage_promos").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePromoSurfaces();
  return { success: true };
}
