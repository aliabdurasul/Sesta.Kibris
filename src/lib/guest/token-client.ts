"use client";

/**
 * Browser-only guest token + remembered order ids (localStorage).
 */
import {
  createGuestToken,
  GUEST_ORDER_IDS_STORAGE_KEY,
  GUEST_TOKEN_STORAGE_KEY,
  isValidGuestToken,
  isValidOrderId,
} from "@/lib/guest/token";

export function getStoredGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  return isValidGuestToken(value) ? value : null;
}

/** Returns existing token or creates and persists a new one. */
export function getOrCreateGuestToken(): string {
  const existing = getStoredGuestToken();
  if (existing) return existing;
  const token = createGuestToken();
  localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
  return token;
}

export function rememberGuestOrder(orderId: string): void {
  if (!isValidOrderId(orderId)) return;
  const existing = getRememberedGuestOrderIds();
  if (!existing.includes(orderId)) {
    existing.unshift(orderId);
    localStorage.setItem(
      GUEST_ORDER_IDS_STORAGE_KEY,
      JSON.stringify(existing.slice(0, 20)),
    );
  }
}

export function getRememberedGuestOrderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_ORDER_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => isValidOrderId(id));
  } catch {
    return [];
  }
}
