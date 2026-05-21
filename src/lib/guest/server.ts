import { cookies } from "next/headers";
import {
  GUEST_USER_ID_COOKIE,
  guestCookieOptions,
  isValidGuestUserId,
  newGuestUserId,
} from "@/lib/guest/session";

/** Read guest id from cookie (may be null on first request before middleware response). */
export async function getGuestUserIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(GUEST_USER_ID_COOKIE)?.value;
  return isValidGuestUserId(value) ? value! : null;
}

/**
 * Guarantees a guest id on the current request (sets cookie in RSC/API).
 * Fixes first-visit /checkout where middleware Set-Cookie is not yet on the request.
 */
export async function ensureGuestUserId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_USER_ID_COOKIE)?.value;
  if (isValidGuestUserId(existing)) return existing!;

  const id = newGuestUserId();
  store.set(GUEST_USER_ID_COOKIE, id, guestCookieOptions());
  return id;
}
