/**
 * Guest checkout token — stored in localStorage + orders.guest_token.
 * Accepts plain UUID or legacy sk_guest_{uuid} format.
 */

export const GUEST_TOKEN_PREFIX = "sk_guest_";
/** Primary localStorage key (user-facing). */
export const GUEST_TOKEN_STORAGE_KEY = "guest_token";
/** Legacy key — read for backward compatibility. */
export const GUEST_TOKEN_STORAGE_KEY_LEGACY = "sesta_guest_token";
export const GUEST_ORDER_IDS_STORAGE_KEY = "sesta_guest_order_ids";
export const GUEST_ORDER_TOKENS_STORAGE_KEY = "sesta_guest_order_tokens";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GUEST_TOKEN_RE =
  /^sk_guest_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Header (optional) — query param ?token= is preferred for guest track. */
export const GUEST_TOKEN_HEADER = "x-guest-token";

export function createGuestToken(): string {
  return crypto.randomUUID();
}

export function isValidOrderId(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Plain UUID or sk_guest_{uuid}. */
export function isValidGuestToken(
  value: string | null | undefined,
): value is string {
  if (!value?.trim()) return false;
  const v = value.trim();
  return UUID_RE.test(v) || GUEST_TOKEN_RE.test(v);
}

/** Canonical form for DB storage and comparison (plain UUID). */
export function normalizeGuestToken(value: string): string {
  const v = value.trim();
  if (v.startsWith(GUEST_TOKEN_PREFIX)) {
    return v.slice(GUEST_TOKEN_PREFIX.length);
  }
  return v;
}

/** Normalize phone for storage/display (digits only, keep leading +). */
export function sanitizeGuestPhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) return trimmed;
  return hasPlus ? `+${digits}` : digits;
}

export function guestTokensMatch(stored: string, provided: string): boolean {
  return normalizeGuestToken(stored) === normalizeGuestToken(provided);
}
