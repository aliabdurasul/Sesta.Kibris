"use server";

/**
 * Merchant toggles card checkout — no Stripe Connect required.
 * Payments go to the platform account configured in server env.
 */
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";

export async function setAcceptsOnlinePayment(
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("merchant");
  const supabase = await createServerClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", session.id)
    .maybeSingle();

  if (!merchant) {
    return { ok: false, error: "Market bulunamadı." };
  }

  const merchantId = (merchant as { id: string }).id;

  const admin = createStripeAdminClient();
  const { error } = await admin
    .from("merchants")
    .update({ accepts_online_payment: enabled })
    .eq("id", merchantId)
    .eq("user_id", session.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/merchant/payments");
  return { ok: true };
}
