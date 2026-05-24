/**
 * POST /api/orders/create
 *
 * Validates payload, resolves guest/auth, proxies to create-order edge function.
 * guest_user_id is ALWAYS set server-side — never trusted from client.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveGuestUserId } from "@/lib/guest/server";
import { guestCookieOptions } from "@/lib/guest/session";
import { resolveCheckoutAuth } from "@/lib/orders/resolve-checkout-auth";
import { validateCreateOrderBody } from "@/lib/orders/validate-create-payload";
import { isValidGuestToken, normalizeGuestToken } from "@/lib/guest/token";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !anonKey || !serviceKey) {
    log.error("order.create.config_missing", {
      hasUrl: !!supabaseUrl,
      hasAnon: !!anonKey,
      hasService: !!serviceKey,
    });
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik.", code: "CONFIG" },
      { status: 500 },
    );
  }

  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi.", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  log.info("order.create.start", {
    merchantId: rawBody["merchant_id"] ?? null,
    itemCount: Array.isArray(rawBody["items"]) ? rawBody["items"].length : 0,
  });

  const validated = validateCreateOrderBody(rawBody);
  if (!validated.ok) {
    log.warn("order.create.validation_failed", {
      code: validated.code,
      details: validated.details,
    });
    return NextResponse.json(
      { error: validated.error, code: validated.code, details: validated.details },
      { status: 400 },
    );
  }

  const guestUserId = await resolveGuestUserId();

  let authMode: "guest" | "authenticated" = "guest";
  let userId: string | null = null;

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user) {
      const resolved = await resolveCheckoutAuth(supabase, user);
      authMode = resolved.mode;
      userId = resolved.userId;
    }
  } catch (err) {
    log.warn("order.create.session_read_failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    authMode = "guest";
  }

  const body: Record<string, unknown> = { ...validated.payload };

  if (authMode === "authenticated" && userId) {
    body["authenticated_user_id"] = userId;
    delete body["guest_name"];
    delete body["guest_phone"];
    delete body["guest_email"];
  } else {
    authMode = "guest";
    body["guest_user_id"] = guestUserId;

    const guestToken =
      typeof rawBody["guest_token"] === "string"
        ? rawBody["guest_token"].trim()
        : "";
    if (!isValidGuestToken(guestToken)) {
      log.warn("order.create.validation_failed", { code: "INVALID_GUEST_TOKEN" });
      return NextResponse.json(
        {
          error: "Misafir oturumu geçersiz. Sayfayı yenileyip tekrar deneyin.",
          code: "INVALID_GUEST_TOKEN",
          authMode,
        },
        { status: 400 },
      );
    }
    body["guest_token"] = normalizeGuestToken(guestToken);
    delete body["guest_email"];

    if (!body["guest_name"] || !body["guest_phone"]) {
      log.warn("order.create.validation_failed", {
        code: "GUEST_FIELDS_REQUIRED",
        guestUserId,
      });
      return NextResponse.json(
        {
          error: "Misafir sipariş için ad ve telefon zorunludur.",
          code: "GUEST_FIELDS_REQUIRED",
          authMode,
        },
        { status: 400 },
      );
    }
  }

  log.info("order.create.proxy", {
    authMode,
    guestUserId: authMode === "guest" ? guestUserId : null,
    guestToken: authMode === "guest" ? body["guest_token"] : null,
    userId: userId ?? null,
    merchantId: validated.payload.merchant_id,
    productIds: validated.payload.items.map((i) => i.product_id),
    itemCount: validated.payload.items.length,
  });

  const edgeHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${serviceKey}`,
    "X-Checkout-Auth-Mode": authMode,
  };

  let edgeRes: Response;
  try {
    edgeRes = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
      method: "POST",
      headers: edgeHeaders,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    log.error("order.create.edge_fetch_failed", {
      authMode,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      {
        error: "Sipariş servisine ulaşılamadı.",
        code: "EDGE_UNREACHABLE",
        authMode,
      },
      { status: 502 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await edgeRes.json()) as Record<string, unknown>;
  } catch {
    payload = {
      error: "Sipariş servisi geçersiz yanıt döndü.",
      code: "EDGE_BAD_JSON",
    };
  }

  if (!edgeRes.ok) {
    const logEvent =
      payload["code"] === "ORDER_ITEMS_INSERT_FAILED"
        ? "order.create.items_insert_failed"
        : "api.orders.create.edge_error";

    log.error(logEvent, {
      authMode,
      status: edgeRes.status,
      code: payload["code"] ?? null,
      message: payload["error"] ?? null,
      dbCode: payload["db_code"] ?? null,
      dbMessage: payload["db_message"] ?? null,
      dbDetails: payload["db_details"] ?? null,
      dbHint: payload["db_hint"] ?? null,
      orderId: payload["order_id"] ?? null,
      merchantId: validated.payload.merchant_id,
      guestUserId: authMode === "guest" ? guestUserId : null,
      userId: userId ?? null,
    });

    return NextResponse.json(
      { ...payload, authMode, source: "create-order" },
      { status: edgeRes.status },
    );
  }

  const orderId =
    typeof payload["order_id"] === "string" ? payload["order_id"] : null;

  log.info("order.create.success", {
    authMode,
    orderId,
    merchantId: validated.payload.merchant_id,
    guestUserId: authMode === "guest" ? guestUserId : null,
    userId: userId ?? null,
    itemCount: validated.payload.items.length,
  });

  const response = NextResponse.json(
    {
      ...payload,
      authMode,
      order: orderId ? { id: orderId } : undefined,
      guest_token:
        authMode === "guest"
          ? (typeof payload["guest_token"] === "string"
              ? payload["guest_token"]
              : body["guest_token"])
          : undefined,
    },
    { status: edgeRes.status },
  );

  if (authMode === "guest") {
    response.cookies.set("guest_user_id", guestUserId, guestCookieOptions());
  }

  return response;
}
