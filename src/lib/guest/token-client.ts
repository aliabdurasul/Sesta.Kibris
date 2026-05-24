"use client";

/**
 * Browser-only guest token + per-order token map (localStorage).
 */
import {
  createGuestToken,
  GUEST_ORDER_IDS_STORAGE_KEY,
  GUEST_ORDER_TOKENS_STORAGE_KEY,
  GUEST_TOKEN_STORAGE_KEY,
  GUEST_TOKEN_STORAGE_KEY_LEGACY,
  isValidGuestToken,
  isValidOrderId,
} from "@/lib/guest/token";

function readStorageKeys(): string[] {
  const keys: string[] = [];
  const primary = localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  if (primary) keys.push(primary);
  const legacy = localStorage.getItem(GUEST_TOKEN_STORAGE_KEY_LEGACY);
  if (legacy) keys.push(legacy);
  return keys;
}

export function getStoredGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const value of readStorageKeys()) {
    if (isValidGuestToken(value)) return value.trim();
  }
  return null;
}

/** Persist global + per-order guest token after successful checkout. */
export function saveGuestToken(token: string, orderId?: string): void {
  if (!isValidGuestToken(token)) return;
  const trimmed = token.trim();
  localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, trimmed);
  localStorage.setItem(GUEST_TOKEN_STORAGE_KEY_LEGACY, trimmed);
  if (orderId && isValidOrderId(orderId)) {
    const map = getOrderTokenMap();
    map[orderId] = trimmed;
    localStorage.setItem(GUEST_ORDER_TOKENS_STORAGE_KEY, JSON.stringify(map));
  }
}

function getOrderTokenMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GUEST_ORDER_TOKENS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isValidOrderId(k) && isValidGuestToken(v)) {
        out[k] = (v as string).trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Token for a specific order — never auto-generates (prevents track mismatch). */
export function getGuestTokenForOrder(orderId: string): string | null {
  if (!isValidOrderId(orderId)) return null;
  const fromMap = getOrderTokenMap()[orderId];
  if (isValidGuestToken(fromMap)) return fromMap!.trim();
  return getStoredGuestToken();
}

/** Only call before first checkout on this device — not on track pages. */
export function getOrCreateGuestToken(): string {
  const existing = getStoredGuestToken();
  if (existing) return existing;
  const token = createGuestToken();
  saveGuestToken(token);
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
