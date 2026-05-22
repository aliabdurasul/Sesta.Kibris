"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import {
  meetsOnboardingThreshold,
  parseOpeningHours,
  type OpeningHours,
} from "@/lib/market/onboarding";
import { normalizeWhatsAppDigits } from "@/lib/market/whatsapp";
import type { Database, Json } from "@/types/database";

type MerchantProfileUpdate =
  Database["public"]["Tables"]["merchants"]["Update"];

const MAX_BYTES = 5 * 1024 * 1024;

async function updateMerchantRow(
  merchantId: string,
  patch: MerchantProfileUpdate,
): Promise<{ error: { message: string } | null }> {
  const supabase = await createServerClient();
  return (
    supabase as unknown as {
      from: (table: string) => {
        update: (values: MerchantProfileUpdate) => {
          eq: (
            col: string,
            val: string,
          ) => Promise<{ error: { message: string } | null }>;
        };
      };
    }
  )
    .from("merchants")
    .update(patch)
    .eq("id", merchantId);
}
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type AssetType = "logo" | "cover";

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

async function getOwnedMerchantId(userId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("merchants")
    .select("id, slug")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return (data as { id: string }).id;

  const { data: byOwner } = await supabase
    .from("merchants")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  return (byOwner as { id: string } | null)?.id ?? null;
}

async function getMerchantSlug(merchantId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("merchants")
    .select("slug")
    .eq("id", merchantId)
    .maybeSingle();
  return (data as { slug: string } | null)?.slug ?? null;
}

function revalidateMarketPaths(slug: string | null) {
  revalidatePath("/");
  revalidatePath("/merchant/profile");
  if (slug) revalidatePath(`/market/${slug}`);
}

export async function uploadMerchantAsset(
  assetType: AssetType,
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await requireRole("merchant");
  const merchantId = await getOwnedMerchantId(session.id);
  if (!merchantId) {
    return { ok: false, error: "Market kaydı bulunamadı." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Dosya seçilmedi." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Sadece JPEG, PNG, WebP veya GIF yükleyebilirsiniz." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Dosya en fazla 5 MB olabilir." };
  }

  const ext = extFromMime(file.type);
  const path = `${merchantId}/${assetType}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = await createServerClient();
  const { error: uploadError } = await supabase.storage
    .from("merchant-assets")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    log.error("merchant.profile.upload", {
      merchantId,
      assetType,
      reason: uploadError.message,
    });
    return { ok: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage
    .from("merchant-assets")
    .getPublicUrl(path);

  const publicUrl = urlData.publicUrl;
  const isLogo = assetType === "logo";

  const { data: fullRow } = await supabase
    .from("merchants")
    .select(
      "logo_url, cover_image_url, opening_hours, delivery_time_min, delivery_time_max, onboarded_at",
    )
    .eq("id", merchantId)
    .maybeSingle();

  const merged = {
    ...(fullRow as Record<string, unknown> | null),
    ...(isLogo ? { logo_url: publicUrl } : { cover_image_url: publicUrl }),
  };
  const isOnboarded = meetsOnboardingThreshold(
    merged as Parameters<typeof meetsOnboardingThreshold>[0],
  );
  const onboardedAt = (fullRow as { onboarded_at?: string | null } | null)
    ?.onboarded_at;

  const patch = isLogo
      ? {
          logo_url: publicUrl,
          updated_by_merchant: true,
          is_onboarded: isOnboarded,
          onboarded_at: isOnboarded
            ? onboardedAt ?? new Date().toISOString()
            : onboardedAt,
        }
      : ({
          cover_image_url: publicUrl,
          updated_by_merchant: true,
          is_onboarded: isOnboarded,
          onboarded_at: isOnboarded
            ? onboardedAt ?? new Date().toISOString()
            : onboardedAt,
        } as const);

  const { error: updateError } = await updateMerchantRow(merchantId, patch);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const slug = await getMerchantSlug(merchantId);
  revalidateMarketPaths(slug);

  return { ok: true, url: publicUrl };
}

export type ProfileFormState = { error?: string; success?: string } | null;

export async function updateMerchantProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await requireRole("merchant");
  const merchantId = await getOwnedMerchantId(session.id);
  if (!merchantId) {
    return { error: "Market kaydı bulunamadı." };
  }

  const supabase = await createServerClient();

  const { data: current } = await supabase
    .from("merchants")
    .select(
      "slug, logo_url, cover_image_url, opening_hours, delivery_time_min, delivery_time_max, onboarded_at",
    )
    .eq("id", merchantId)
    .maybeSingle();

  const row = current as {
    slug: string;
    logo_url: string | null;
    cover_image_url: string | null;
    opening_hours: Json | null;
    delivery_time_min: number | null;
    delivery_time_max: number | null;
    onboarded_at: string | null;
  } | null;

  if (!row) return { error: "Market bulunamadı." };

  const profile_address =
    (formData.get("profile_address") as string | null)?.trim() || null;
  const whatsappRaw =
    (formData.get("whatsapp_phone") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const deliveryMinRaw = formData.get("delivery_time_min") as string | null;
  const deliveryMaxRaw = formData.get("delivery_time_max") as string | null;
  const deliveryFeeRaw = formData.get("delivery_fee") as string | null;
  const minOrderRaw = formData.get("minimum_order_amount") as string | null;

  const delivery_time_min = deliveryMinRaw
    ? parseInt(deliveryMinRaw, 10)
    : row.delivery_time_min;
  const delivery_time_max = deliveryMaxRaw
    ? parseInt(deliveryMaxRaw, 10)
    : row.delivery_time_max;
  const delivery_fee = deliveryFeeRaw
    ? Math.round(parseFloat(deliveryFeeRaw) * 100)
    : null;
  const minimum_order_amount =
    minOrderRaw?.trim() !== ""
      ? Math.round(parseFloat(minOrderRaw!) * 100)
      : null;

  if (minimum_order_amount != null && minimum_order_amount <= 0) {
    return { error: "Minimum sipariş 0 TL'den büyük olmalıdır." };
  }

  let whatsapp_phone: string | null = whatsappRaw;
  if (whatsappRaw) {
    const digits = normalizeWhatsAppDigits(whatsappRaw);
    if (!digits) {
      return { error: "Geçerli bir WhatsApp numarası girin." };
    }
    whatsapp_phone = whatsappRaw;
  }

  if (
    delivery_time_min != null &&
    delivery_time_max != null &&
    delivery_time_max < delivery_time_min
  ) {
    return { error: "Maksimum teslimat süresi minimumdan küçük olamaz." };
  }

  const opening_hours = parseOpeningHoursFromForm(formData);

  const merged = {
    logo_url: row.logo_url,
    cover_image_url: row.cover_image_url,
    opening_hours: opening_hours as Json,
    delivery_time_min,
    delivery_time_max,
    description,
  };

  const isOnboarded = meetsOnboardingThreshold(merged);
  const now = new Date().toISOString();

  const { error } = await updateMerchantRow(merchantId, {
    profile_address,
    whatsapp_phone,
    description,
    opening_hours: opening_hours as Json,
    delivery_time_min,
    delivery_time_max,
    delivery_fee,
    minimum_order_amount,
    updated_by_merchant: true,
    is_onboarded: isOnboarded,
    onboarded_at: isOnboarded ? row.onboarded_at ?? now : row.onboarded_at,
  });

  if (error) {
    log.error("merchant.profile.update", { merchantId, reason: error.message });
    return { error: error.message };
  }

  revalidateMarketPaths(row.slug);

  return {
    success: isOnboarded
      ? "Profil kaydedildi. Mağazanız tam profilli olarak listeleniyor."
      : "Profil kaydedildi. Eksik alanları tamamlayın.",
  };
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function parseOpeningHoursFromForm(formData: FormData): OpeningHours {
  const hours = parseOpeningHours(null);
  for (const day of DAYS) {
    const closed = formData.get(`${day}_closed`) === "on";
    const open = (formData.get(`${day}_open`) as string | null)?.trim() ?? "";
    const close = (formData.get(`${day}_close`) as string | null)?.trim() ?? "";
    if (closed) {
      hours[day] = { closed: true };
    } else if (open && close) {
      hours[day] = { open, close };
    }
  }
  return hours;
}
