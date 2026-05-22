/**
 * Merchant onboarding checklist and completion threshold.
 */
import type { Json } from "@/types/database";

export type OpeningHoursDay = {
  open?: string;
  close?: string;
  closed?: boolean;
};

export type OpeningHours = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", OpeningHoursDay>
>;

export type MerchantProfileSource = {
  logo_url?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  opening_hours?: Json | null;
  delivery_time_min?: number | null;
  delivery_time_max?: number | null;
  delivery_fee?: number | null;
  minimum_order_amount?: number | null;
};

const CHECKLIST_KEYS = [
  "logo_url",
  "cover_image_url",
  "opening_hours",
  "delivery_time_min",
  "delivery_time_max",
] as const;

export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];

const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  logo_url: "Logo",
  cover_image_url: "Kapak görseli",
  opening_hours: "Çalışma saatleri",
  delivery_time_min: "Minimum teslimat süresi",
  delivery_time_max: "Maksimum teslimat süresi",
};

function hasOpeningHours(hours: Json | null | undefined): boolean {
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return false;
  const record = hours as OpeningHours;
  return Object.values(record).some(
    (day) =>
      day &&
      typeof day === "object" &&
      ((day.closed === true) ||
        (typeof day.open === "string" &&
          day.open.length > 0 &&
          typeof day.close === "string" &&
          day.close.length > 0)),
  );
}

function isChecklistItemDone(
  key: ChecklistKey,
  merchant: MerchantProfileSource,
): boolean {
  switch (key) {
    case "logo_url":
      return Boolean(merchant.logo_url?.trim());
    case "cover_image_url":
      return Boolean(merchant.cover_image_url?.trim());
    case "opening_hours":
      return hasOpeningHours(merchant.opening_hours);
    case "delivery_time_min":
      return (
        merchant.delivery_time_min != null && merchant.delivery_time_min > 0
      );
    case "delivery_time_max":
      return (
        merchant.delivery_time_max != null &&
        merchant.delivery_time_max > 0 &&
        (merchant.delivery_time_min == null ||
          merchant.delivery_time_max >= merchant.delivery_time_min)
      );
    default:
      return false;
  }
}

export function meetsOnboardingThreshold(
  merchant: MerchantProfileSource,
): boolean {
  return CHECKLIST_KEYS.every((key) => isChecklistItemDone(key, merchant));
}

export function computeOnboardingProgress(merchant: MerchantProfileSource): {
  percent: number;
  complete: boolean;
  missing: string[];
} {
  const done = CHECKLIST_KEYS.filter((key) =>
    isChecklistItemDone(key, merchant),
  );
  const missing = CHECKLIST_KEYS.filter(
    (key) => !isChecklistItemDone(key, merchant),
  ).map((key) => CHECKLIST_LABELS[key]);

  return {
    percent: Math.round((done.length / CHECKLIST_KEYS.length) * 100),
    complete: done.length === CHECKLIST_KEYS.length,
    missing,
  };
}

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: { open: "08:00", close: "22:00" },
  tue: { open: "08:00", close: "22:00" },
  wed: { open: "08:00", close: "22:00" },
  thu: { open: "08:00", close: "22:00" },
  fri: { open: "08:00", close: "22:00" },
  sat: { open: "09:00", close: "21:00" },
  sun: { closed: true },
};

export function parseOpeningHours(
  raw: Json | null | undefined,
): OpeningHours {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_OPENING_HOURS };
  }
  return raw as OpeningHours;
}
