import type { User } from "@supabase/supabase-js";

/**
 * Shared helper — safe for middleware, route handlers, server actions, and client.
 */
export function userMustChangePassword(user: User | null): boolean {
  if (!user) return false;
  const m = user.user_metadata as Record<string, unknown> | undefined;
  return m?.["password_change_required"] === true;
}
