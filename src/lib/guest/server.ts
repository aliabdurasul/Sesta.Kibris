import { cookies } from "next/headers";
import {
  GUEST_USER_ID_COOKIE,
  isValidGuestUserId,
  newGuestUserId,
} from "@/lib/guest/session";

/** Read guest id from cookie (may be null on first visit). */
export async function getGuestUserIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(GUEST_USER_ID_COOKIE)?.value;
  return isValidGuestUserId(value) ? value! : null;
}

/**
 * Returns existing guest id or generates a new one.
 * Does NOT mutate cookies — caller must set cookie in Route Handler / middleware.
 */
export async function resolveGuestUserId(): Promise<string> {
  const existing = await getGuestUserIdFromCookies();
  if (existing) return existing;
  return newGuestUserId();
}
