/**
 * Shared sign-out logic — clears Supabase session + app cookies.
 * Used by the server action, route handler, and auth.ts helper.
 */
import { revalidatePath } from "next/cache";
import { log } from "@/lib/logger";
import { clearSessionAuxCookies } from "@/lib/auth/session-cookies";

type CookieSetter = (
  name: string,
  value: string,
  options: ReturnType<typeof import("@/lib/auth/session-cookies").clearCookieOptions>,
) => void;

export interface SignOutClients {
  signOut: () => Promise<{ error: Error | null }>;
  setCookie: CookieSetter;
}

/** Clears Supabase auth + auxiliary session cookies. Does not redirect. */
export async function clearAuthSession(clients: SignOutClients): Promise<void> {
  log.info("auth.signout.start");

  const { error } = await clients.signOut();
  if (error) {
    log.warn("auth.signout.supabase_error", { reason: error.message });
  }

  clearSessionAuxCookies(clients.setCookie);
  revalidatePath("/", "layout");

  log.info("auth.signout.success");
}
