/**
 * Shared proxy to create-order edge function (COD and card).
 * Used by /api/orders/create and /api/stripe/checkout/create-from-cart.
 */
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveGuestUserId } from "@/lib/guest/server";
import { resolveCheckoutAuth } from "@/lib/orders/resolve-checkout-auth";
import {
  validateCreateOrderBody,
  type ValidatedCreateOrderPayload,
} from "@/lib/orders/validate-create-payload";
import { isValidGuestToken, normalizeGuestToken } from "@/lib/guest/token";
import { log } from "@/lib/logger";

export type ProxyCreateOrderResult =
  | {
      ok: true;
      orderId: string;
      authMode: "guest" | "authenticated";
      guestUserId: string | null;
      guestToken: string | null;
      payload: Record<string, unknown>;
    }
  | {
      ok: false;
      status: number;
      body: Record<string, unknown>;
    };

export async function proxyCreateOrder(
  request: NextRequest,
  rawBody: Record<string, unknown>,
  options?: { forcePaymentMethod?: "card" },
): Promise<ProxyCreateOrderResult> {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return {
      ok: false,
      status: 500,
      body: { error: "Sunucu yapılandırması eksik.", code: "CONFIG" },
    };
  }

  const validated = validateCreateOrderBody(rawBody);
  if (!validated.ok) {
    return {
      ok: false,
      status: 400,
      body: {
        error: validated.error,
        code: validated.code,
        details: validated.details,
      },
    };
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
  } catch {
    authMode = "guest";
  }

  const body: Record<string, unknown> = {
    ...validated.payload,
    payment_method: options?.forcePaymentMethod ?? validated.payload.payment_method,
  };

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
      return {
        ok: false,
        status: 400,
        body: {
          error:
            "Misafir oturumu geçersiz. Sayfayı yenileyip tekrar deneyin.",
          code: "INVALID_GUEST_TOKEN",
          authMode,
        },
      };
    }
    body["guest_token"] = normalizeGuestToken(guestToken);
    delete body["guest_email"];

    if (!body["guest_name"] || !body["guest_phone"]) {
      return {
        ok: false,
        status: 400,
        body: {
          error: "Misafir sipariş için ad ve telefon zorunludur.",
          code: "GUEST_FIELDS_REQUIRED",
          authMode,
        },
      };
    }
  }

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
      reason: err instanceof Error ? err.message : "unknown",
    });
    return {
      ok: false,
      status: 502,
      body: {
        error: "Sipariş servisine ulaşılamadı.",
        code: "EDGE_UNREACHABLE",
        authMode,
      },
    };
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
    return {
      ok: false,
      status: edgeRes.status,
      body: { ...payload, authMode, source: "create-order" },
    };
  }

  const orderId =
    typeof payload["order_id"] === "string" ? payload["order_id"] : null;

  if (!orderId) {
    return {
      ok: false,
      status: 500,
      body: {
        error: "Sipariş oluşturuldu ancak sipariş numarası alınamadı.",
        code: "MISSING_ORDER_ID",
      },
    };
  }

  return {
    ok: true,
    orderId,
    authMode,
    guestUserId: authMode === "guest" ? guestUserId : null,
    guestToken:
      authMode === "guest" && typeof body["guest_token"] === "string"
        ? body["guest_token"]
        : null,
    payload,
  };
}

export type { ValidatedCreateOrderPayload };
