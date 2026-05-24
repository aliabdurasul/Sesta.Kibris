/**
 * GET /api/orders/guest — list guest orders for the current guest token.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchGuestOrdersByToken } from "@/lib/orders/fetch-guest-order";
import { GUEST_TOKEN_HEADER, isValidGuestToken } from "@/lib/guest/token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const guestToken =
    request.headers.get(GUEST_TOKEN_HEADER) ??
    request.headers.get("X-Guest-Token");

  if (!isValidGuestToken(guestToken)) {
    return NextResponse.json(
      { error: "Geçersiz misafir oturumu.", code: "INVALID_TOKEN" },
      { status: 401 },
    );
  }

  const orders = await fetchGuestOrdersByToken(guestToken!);
  return NextResponse.json({ orders });
}
