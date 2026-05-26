/**
 * POST /api/stripe/connect/create
 * Creates a Stripe Connect v2 account for the logged-in merchant (once).
 */
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { createConnectV2Account } from "@/lib/stripe/connect";
import { log } from "@/lib/logger";
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

    const { data: existing } = await admin
      .from("merchant_stripe_accounts")
      .select("stripe_account_id")
      .eq("merchant_id", session.merchantId)
      .maybeSingle();

    if (existing?.stripe_account_id) {
      return NextResponse.json({
        stripe_account_id: existing.stripe_account_id,
        already_exists: true,
      });
    }

    const { data: merchant } = await admin
      .from("merchants")
      .select("name")
      .eq("id", session.merchantId)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const account = await createConnectV2Account({
      displayName: merchant.name,
      contactEmail: session.email,
    });

    const { error: insertError } = await admin.from("merchant_stripe_accounts").insert({
      merchant_id: session.merchantId,
      user_id: session.id,
      stripe_account_id: account.id,
    });

    if (insertError) {
      log.error("stripe.connect.db_insert_failed", {
        merchantId: session.merchantId,
        reason: insertError.message,
      });
      return NextResponse.json({ error: "Failed to save Stripe account" }, { status: 500 });
    }

    log.info("stripe.connect.account_created", {
      merchantId: session.merchantId,
      stripeAccountId: account.id,
    });

    return NextResponse.json({
      stripe_account_id: account.id,
      already_exists: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connect create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
