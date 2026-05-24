/**
 * GET /api/orders/[orderId]/track
 * Guest order tracking — requires X-Guest-Token header matching orders.guest_token.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchGuestOrderById } from "@/lib/orders/fetch-guest-order";
import { GUEST_TOKEN_HEADER, isValidGuestToken, isValidOrderId } from "@/lib/guest/token";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  const guestToken =
    request.headers.get(GUEST_TOKEN_HEADER) ??
    request.headers.get("X-Guest-Token");

  if (!isValidOrderId(orderId) || !isValidGuestToken(guestToken)) {
    return NextResponse.json(
      { error: "Sipariş bulunamadı.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const order = await fetchGuestOrderById(orderId, guestToken!);

  if (!order) {
    log.warn("guest.order.track_denied", { orderId });
    return NextResponse.json(
      { error: "Sipariş bulunamadı.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ order });
}
