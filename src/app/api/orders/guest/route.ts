/**
 * GET /api/orders/guest?token=xxx — list guest orders for the current guest token.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchGuestOrdersByToken } from "@/lib/orders/fetch-guest-order";
import { GUEST_TOKEN_HEADER, isValidGuestToken } from "@/lib/guest/token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractGuestToken(request: NextRequest): string | null {
  const fromQuery = request.nextUrl.searchParams.get("token")?.trim();
  if (fromQuery && isValidGuestToken(fromQuery)) return fromQuery;

  const fromHeader =
    request.headers.get(GUEST_TOKEN_HEADER) ??
    request.headers.get("X-Guest-Token");
  if (fromHeader && isValidGuestToken(fromHeader.trim())) return fromHeader.trim();

  return null;
}

export async function GET(request: NextRequest) {
  const guestToken = extractGuestToken(request);

  if (!guestToken) {
    return NextResponse.json(
      { error: "Geçersiz misafir oturumu.", code: "INVALID_TOKEN" },
      { status: 401 },
    );
  }

  const orders = await fetchGuestOrdersByToken(guestToken);
  return NextResponse.json({ orders });
}
