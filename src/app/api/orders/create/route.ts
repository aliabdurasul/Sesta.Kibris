/**
 * POST /api/orders/create
 *
 * Does NOT require a Supabase session for guests.
 * guest_user_id is ALWAYS set server-side via ensureGuestUserId() — never trusted from client.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ensureGuestUserId } from "@/lib/guest/server";
import { guestCookieOptions } from "@/lib/guest/session";
import { resolveCheckoutAuth } from "@/lib/orders/resolve-checkout-auth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !anonKey || !serviceKey) {
    log.error("api.orders.create.config", {
      hasUrl: !!supabaseUrl,
      hasAnon: !!anonKey,
      hasService: !!serviceKey,
    });
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik.", code: "CONFIG" },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi.", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  // Never trust client guest identity
  delete body["guest_user_id"];

  const guestUserId = await ensureGuestUserId();

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
    log.warn("api.orders.create.session_read_failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    authMode = "guest";
  }

  if (authMode === "authenticated" && userId) {
    body["authenticated_user_id"] = userId;
    delete body["guest_name"];
    delete body["guest_phone"];
    delete body["guest_email"];
  } else {
    authMode = "guest";
    body["guest_user_id"] = guestUserId;
    if (!body["guest_name"] || !body["guest_phone"]) {
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

  log.info("api.orders.create", {
    authMode,
    guest_user_id: authMode === "guest" ? guestUserId : null,
    userId: userId ?? null,
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
    log.error("api.orders.create.edge_fetch", {
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
    log.error("api.orders.create.edge_error", {
      authMode,
      status: edgeRes.status,
      payload,
    });
    return NextResponse.json(
      { ...payload, authMode, source: "create-order" },
      { status: edgeRes.status },
    );
  }

  const response = NextResponse.json({ ...payload, authMode }, { status: edgeRes.status });

  response.cookies.set("guest_user_id", guestUserId, guestCookieOptions());

  return response;
}
