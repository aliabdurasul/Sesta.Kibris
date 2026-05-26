/**
 * GET /api/merchants/[merchantId]/payment-capabilities
 *
 * Checkout UI uses this to show/hide the card payment option.
 */
import { NextResponse } from "next/server";
import { getMerchantPaymentCapabilities } from "@/lib/stripe/payment-capabilities";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ merchantId: string }> },
) {
  const { merchantId } = await context.params;

  if (!UUID_RE.test(merchantId)) {
    return NextResponse.json({ error: "Invalid merchant id" }, { status: 400 });
  }

  try {
    const capabilities = await getMerchantPaymentCapabilities(merchantId);
    return NextResponse.json(capabilities);
  } catch {
    return NextResponse.json(
      { error: "Could not load payment options" },
      { status: 500 },
    );
  }
}
