import { NextResponse } from "next/server";
import { isStripeConnectEnabled } from "@/lib/stripe/features";

/** Guard Connect-only API routes when ENABLE_STRIPE_CONNECT is not true. */
export function connectDisabledResponse(): NextResponse | null {
  if (isStripeConnectEnabled()) return null;
  return NextResponse.json(
    {
      error: "Stripe Connect is disabled. Platform card checkout is active.",
      code: "STRIPE_CONNECT_DISABLED",
    },
    { status: 403 },
  );
}
