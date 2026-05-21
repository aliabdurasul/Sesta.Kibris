/**
 * Session cookies alongside Supabase auth (not JWT).
 */
import {
  GUEST_USER_ID_COOKIE,
  guestCookieOptions,
} from "@/lib/guest/session";

/** Last role established at login — must match JWT app_metadata.role */
export const ACTIVE_ROLE_COOKIE = "sk_active_role";

export function activeRoleCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

/** Clear guest + active-role cookies on the response or cookie store */
export function clearSessionAuxCookies(
  set: (name: string, value: string, options: ReturnType<typeof clearCookieOptions>) => void,
): void {
  const opts = clearCookieOptions();
  set(GUEST_USER_ID_COOKIE, "", opts);
  set(ACTIVE_ROLE_COOKIE, "", opts);
}

/** Set active role after successful login */
export function setActiveRoleCookie(
  set: (name: string, value: string, options: ReturnType<typeof activeRoleCookieOptions>) => void,
  role: string,
): void {
  set(ACTIVE_ROLE_COOKIE, role, activeRoleCookieOptions());
}
