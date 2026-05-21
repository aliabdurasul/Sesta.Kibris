/**
 * POST /api/orders/create
 *
 * Does NOT require a Supabase session for guests.
 * Uses service role to invoke create-order (avoids Edge gateway 401 without JWT).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ensureGuestUserId } from "@/lib/guest/server";
import { guestCookieOptions, isValidGuestUserId } from "@/lib/guest/session";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

type AuthMode = "guest" | "authenticated";

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

  let authMode: AuthMode = "guest";
  let userId: string | null = null;
  let jwtPresent = false;

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user) {
      const role = (user.app_metadata as Record<string, string> | undefined)?.[
        "role"
      ];
      if (role === "customer") {
        authMode = "authenticated";
        userId = user.id;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        jwtPresent = !!session?.access_token;
      } else if (role) {
        return NextResponse.json(
          {
            error:
              "Bu hesap türü sipariş veremez. Misafir olarak devam edin veya müşteri hesabı kullanın.",
            code: "ROLE_NOT_CUSTOMER",
            role,
          },
          { status: 403 },
        );
      }
    }
  } catch (err) {
    log.warn("api.orders.create.session_read_failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    authMode = "guest";
  }

  const guestUserId = await ensureGuestUserId();

  if (authMode === "guest") {
    body["guest_user_id"] = guestUserId;
    if (!body["guest_name"] || !body["guest_phone"]) {
      return NextResponse.json(
        {
          error: "Misafir sipariş için ad ve telefon zorunludur.",
          code: "GUEST_FIELDS_REQUIRED",
          authMode,
          guest_user_id: guestUserId,
        },
        { status: 400 },
      );
    }
  } else {
    body["authenticated_user_id"] = userId;
    delete body["guest_user_id"];
  }

  const guestId = body["guest_user_id"];
  if (
    authMode === "guest" &&
    typeof guestId === "string" &&
    !isValidGuestUserId(guestId)
  ) {
    return NextResponse.json(
      {
        error: "Geçersiz misafir oturumu.",
        code: "INVALID_GUEST_ID",
        guest_user_id: guestId,
      },
      { status: 400 },
    );
  }

  log.info("api.orders.create", {
    authMode,
    guest_user_id: authMode === "guest" ? guestUserId : null,
    jwtPresent,
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
    payload = { error: "Sipariş servisi geçersiz yanıt döndü.", code: "EDGE_BAD_JSON" };
  }

  if (!edgeRes.ok) {
    log.error("api.orders.create.edge_error", {
      authMode,
      status: edgeRes.status,
      payload,
    });
    return NextResponse.json(
      {
        ...payload,
        authMode,
        guest_user_id: authMode === "guest" ? guestUserId : undefined,
        jwtPresent,
        source: "create-order",
      },
      { status: edgeRes.status },
    );
  }

  const response = NextResponse.json(
    {
      ...payload,
      authMode,
    },
    { status: edgeRes.status },
  );

  if (authMode === "guest") {
    response.cookies.set("guest_user_id", guestUserId, guestCookieOptions());
  }

  return response;
}
