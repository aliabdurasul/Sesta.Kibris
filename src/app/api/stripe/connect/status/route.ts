/**
 * GET /api/stripe/connect/status — live Stripe account status (never cached in DB).
 */
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { connectDisabledResponse } from "@/lib/stripe/connect-disabled";

export const runtime = "nodejs";

export async function GET() {
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
      return NextResponse.json({
        has_account: false,
        status: null,
      });
    }

    const status = await getConnectAccountStatus(row.stripe_account_id);
    return NextResponse.json({
      has_account: true,
      status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
