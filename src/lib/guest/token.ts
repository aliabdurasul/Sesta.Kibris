/**
 * Guest checkout token — sk_guest_{uuid}
 * Stored in localStorage on the client; persisted on orders.guest_token.
 */

export const GUEST_TOKEN_PREFIX = "sk_guest_";
export const GUEST_TOKEN_STORAGE_KEY = "sesta_guest_token";
export const GUEST_ORDER_IDS_STORAGE_KEY = "sesta_guest_order_ids";

const GUEST_TOKEN_RE =
  /^sk_guest_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Header sent by client when fetching guest orders. */
export const GUEST_TOKEN_HEADER = "x-guest-token";

export function createGuestToken(): string {
  return `${GUEST_TOKEN_PREFIX}${crypto.randomUUID()}`;
}

export function isValidGuestToken(value: string | null | undefined): value is string {
  return typeof value === "string" && GUEST_TOKEN_RE.test(value.trim());
}

export function isValidOrderId(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Normalize phone for storage/display (digits only, keep leading +). */
export function sanitizeGuestPhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) return trimmed;
  return hasPlus ? `+${digits}` : digits;
}
