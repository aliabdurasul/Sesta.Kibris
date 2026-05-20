/**
 * Guest checkout identity — persisted in httpOnly cookie (not Supabase auth).
 */
export const GUEST_USER_ID_COOKIE = "guest_user_id";

/** 1 year — guest orders remain traceable across visits */
export const GUEST_USER_ID_MAX_AGE = 60 * 60 * 24 * 365;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidGuestUserId(value: string | undefined | null): boolean {
  return typeof value === "string" && UUID_RE.test(value);
}

export function newGuestUserId(): string {
  return crypto.randomUUID();
}

export function guestCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_USER_ID_MAX_AGE,
  };
}
