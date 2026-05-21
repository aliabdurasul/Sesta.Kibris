/**
 * POST /api/orders/create — guest-safe order proxy to create-order Edge Function.
 * Injects guest_user_id from httpOnly cookie; forwards customer JWT when present.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ensureGuestUserId } from "@/lib/guest/server";
import { isValidGuestUserId } from "@/lib/guest/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: "Yapılandırma hatası." }, { status: 500 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: anonKey,
    };

    if (user) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
    } else {
      const guestUserId = await ensureGuestUserId();
      body["guest_user_id"] = guestUserId;
      if (!body["guest_name"] || !body["guest_phone"]) {
        return NextResponse.json(
          { error: "Misafir sipariş için ad ve telefon zorunludur." },
          { status: 400 },
        );
      }
    }

    const guestId = body["guest_user_id"];
    if (
      typeof guestId === "string" &&
      guestId &&
      !isValidGuestUserId(guestId)
    ) {
      return NextResponse.json(
        { error: "Geçersiz misafir oturumu." },
        { status: 400 },
      );
    }

    const edgeRes = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    const payload = (await edgeRes.json()) as Record<string, unknown>;
    return NextResponse.json(payload, { status: edgeRes.status });
  } catch (err) {
    console.error("api.orders.create", err);
    return NextResponse.json(
      { error: "Sipariş oluşturulamadı." },
      { status: 500 },
    );
  }
}
