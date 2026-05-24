/**
 * GET /api/orders/[orderId]/track?token=xxx
 * Guest: token query param (no session). Authenticated: session must match customer_id.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fetchOrderForTracking } from "@/lib/orders/fetch-guest-order";
import {
  GUEST_TOKEN_HEADER,
  isValidGuestToken,
  isValidOrderId,
} from "@/lib/guest/token";

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;

  if (!isValidOrderId(orderId)) {
    return NextResponse.json(
      { error: "Sipariş bulunamadı.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const guestToken = extractGuestToken(request);

  let authenticatedUserId: string | null = null;
  if (!guestToken) {
    try {
      const supabase = await createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticatedUserId = user?.id ?? null;
    } catch {
      authenticatedUserId = null;
    }
  }

  const result = await fetchOrderForTracking(
    orderId,
    guestToken,
    authenticatedUserId,
  );

  if (result.status === "ok") {
    return NextResponse.json({ order: result.order });
  }

  if (result.status === "auth_required") {
    return NextResponse.json(
      { error: "Bu siparişi görüntülemek için giriş yapın.", code: "AUTH_REQUIRED" },
      { status: 403 },
    );
  }

  if (result.status === "token_mismatch") {
    return NextResponse.json(
      { error: "Erişim reddedildi.", code: "TOKEN_MISMATCH" },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { error: "Sipariş bulunamadı.", code: "NOT_FOUND" },
    { status: 404 },
  );
}
