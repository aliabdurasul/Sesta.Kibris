import { cookies } from "next/headers";
import {
  GUEST_USER_ID_COOKIE,
  isValidGuestUserId,
} from "@/lib/guest/session";

/** Read guest id set by middleware (httpOnly — server components only). */
export async function getGuestUserIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(GUEST_USER_ID_COOKIE)?.value;
  return isValidGuestUserId(value) ? value! : null;
}
