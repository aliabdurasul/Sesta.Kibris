/**
 * Layered market display resolution: merchant data → category fallbacks → defaults.
 */
import { getDeliveryEta } from "@/lib/landing/merchant-visuals";
import { getMarketCoverImage } from "@/lib/landing/market-images";
import {
  parseOpeningHours,
  type OpeningHours,
  type MerchantProfileSource,
} from "@/lib/market/onboarding";
import type { Json } from "@/types/database";

export type MarketDisplay = {
  name: string;
  slug: string;
  category: string;
  merchantId: string;
  logoUrl: string | null;
  coverUrl: string;
  description: string | null;
  deliveryEtaLabel: string;
  openingHoursLabel: string;
  rating: number | null;
  isOpen: boolean;
  isOnboarded: boolean;
  isDemoMarket: boolean;
  deliveryFeeLabel: string | null;
  address: string | null;
};

export type MerchantDisplaySource = MerchantProfileSource & {
  id: string;
  name: string;
  slug: string;
  category: string;
  address?: string | null;
  is_open?: boolean;
  is_onboarded?: boolean;
  is_demo_market?: boolean;
  updated_by_merchant?: boolean;
  features?: Json | null;
};

const FALLBACK_ETA = "15–20 dk (tahmini)";
const FALLBACK_HOURS = "Bilgi yok";

export function getMarketInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function formatDeliveryFee(kurus: number | null | undefined): string | null {
  if (kurus == null || kurus <= 0) return null;
  const tl = kurus / 100;
  return tl % 1 === 0 ? `${tl} TL` : `${tl.toFixed(2)} TL`;
}

function formatDeliveryEta(
  merchant: MerchantDisplaySource,
  useMerchantData: boolean,
): string {
  if (
    useMerchantData &&
    merchant.delivery_time_min != null &&
    merchant.delivery_time_max != null
  ) {
    if (merchant.delivery_time_min === merchant.delivery_time_max) {
      return `${merchant.delivery_time_min} dk`;
    }
    return `${merchant.delivery_time_min}–${merchant.delivery_time_max} dk`;
  }
  if (
    useMerchantData &&
    merchant.delivery_time_min != null &&
    merchant.delivery_time_min > 0
  ) {
    return `${merchant.delivery_time_min} dk`;
  }
  if (!useMerchantData && !merchant.updated_by_merchant) {
    return getDeliveryEta(merchant.category);
  }
  return FALLBACK_ETA;
}

function formatOpeningHoursLabel(hours: OpeningHours): string {
  const today = new Date();
  const dayIndex = today.getDay();
  const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const todayKey = keys[dayIndex];
  const todayHours = todayKey ? hours[todayKey] : undefined;

  if (todayHours?.closed) return "Bugün kapalı";
  if (todayHours?.open && todayHours?.close) {
    return `Bugün ${todayHours.open}–${todayHours.close}`;
  }

  const firstOpen = Object.entries(hours).find(
    ([, d]) => d && !d.closed && d.open && d.close,
  );
  if (firstOpen) {
    const [, d] = firstOpen;
    return `${d!.open}–${d!.close}`;
  }

  return FALLBACK_HOURS;
}

function extractRating(features: Json | null | undefined): number | null {
  if (!features || typeof features !== "object" || Array.isArray(features)) {
    return null;
  }
  const r = (features as { rating?: unknown }).rating;
  return typeof r === "number" && r > 0 ? r : null;
}

function merchantHasProfileData(merchant: MerchantDisplaySource): boolean {
  return Boolean(
    merchant.updated_by_merchant ||
      merchant.logo_url ||
      merchant.cover_image_url ||
      merchant.description ||
      merchant.opening_hours ||
      merchant.delivery_time_min != null ||
      merchant.delivery_time_max != null,
  );
}

export function resolveMarketDisplay(
  merchant: MerchantDisplaySource,
): MarketDisplay {
  const useMerchantData = merchantHasProfileData(merchant);
  const hours = parseOpeningHours(merchant.opening_hours);

  const coverUrl =
    useMerchantData && merchant.cover_image_url?.trim()
      ? merchant.cover_image_url.trim()
      : getMarketCoverImage(merchant.category, merchant.id);

  const logoUrl =
    useMerchantData && merchant.logo_url?.trim()
      ? merchant.logo_url.trim()
      : null;

  const openingHoursLabel =
    useMerchantData && hasOpeningHoursData(merchant.opening_hours)
      ? formatOpeningHoursLabel(hours)
      : FALLBACK_HOURS;

  return {
    name: merchant.name,
    slug: merchant.slug,
    category: merchant.category,
    merchantId: merchant.id,
    logoUrl,
    coverUrl,
    description: merchant.description?.trim() || null,
    deliveryEtaLabel: formatDeliveryEta(merchant, useMerchantData),
    openingHoursLabel,
    rating: extractRating(merchant.features),
    isOpen: merchant.is_open !== false,
    isOnboarded: merchant.is_onboarded === true,
    isDemoMarket: merchant.is_demo_market === true,
    deliveryFeeLabel: formatDeliveryFee(merchant.delivery_fee),
    address: merchant.address ?? null,
  };
}

function hasOpeningHoursData(hours: Json | null | undefined): boolean {
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return false;
  return Object.values(hours as OpeningHours).some(
    (d) =>
      d &&
      (d.closed === true ||
        (Boolean(d.open?.length) && Boolean(d.close?.length))),
  );
}

export function sortMerchantsForBrowse<T extends { is_onboarded?: boolean; is_demo_market?: boolean; name: string }>(
  merchants: T[],
): T[] {
  return [...merchants].sort((a, b) => {
    const onboardedA = a.is_onboarded ? 1 : 0;
    const onboardedB = b.is_onboarded ? 1 : 0;
    if (onboardedB !== onboardedA) return onboardedB - onboardedA;

    const demoA = a.is_demo_market ? 1 : 0;
    const demoB = b.is_demo_market ? 1 : 0;
    if (demoA !== demoB) return demoA - demoB;

    return a.name.localeCompare(b.name, "tr");
  });
}
