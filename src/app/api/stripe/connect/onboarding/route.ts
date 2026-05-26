/**
 * POST /api/stripe/connect/onboarding
 * Returns a one-time Stripe-hosted onboarding URL for the merchant.
 */
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { createConnectOnboardingLink } from "@/lib/stripe/connect";
import { connectDisabledResponse } from "@/lib/stripe/connect-disabled";

export const runtime = "nodejs";

export async function POST() {
  const disabled = connectDisabledResponse();
  if (disabled) return disabled;

  try {
    const session = await requireRole("merchant");
    if (!session.merchantId) {
      return NextResponse.json({ error: "Merchant profile not found" }, { status: 404 });
    }

    const admin = createStripeAdminClient();
    const { data: row } = await admin
      .from("merchant_stripe_accounts")
      .select("stripe_account_id")
      .eq("merchant_id", session.merchantId)
      .maybeSingle();

    if (!row?.stripe_account_id) {
      return NextResponse.json(
        { error: "Create a Connect account first (POST /api/stripe/connect/create)" },
        { status: 400 },
      );
    }

    const url = await createConnectOnboardingLink(row.stripe_account_id);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onboarding link failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
