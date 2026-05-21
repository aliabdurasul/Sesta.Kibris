/**
 * Server-only checkout auth resolution for /api/orders/create.
 */
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type CheckoutAuthMode = "guest" | "authenticated";

export interface CheckoutAuth {
  mode: CheckoutAuthMode;
  userId: string | null;
}

export async function resolveCheckoutAuth(
  supabase: SupabaseClient<Database>,
  user: User | null,
): Promise<CheckoutAuth> {
  if (!user) {
    return { mode: "guest", userId: null };
  }

  const meta = user.app_metadata as Record<string, string> | undefined;
  const jwtRole = meta?.["role"];

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (customer || jwtRole === "customer") {
    return { mode: "authenticated", userId: user.id };
  }

  // Logged-in merchant/courier/admin: checkout as guest (server sets guest_user_id)
  return { mode: "guest", userId: null };
}
