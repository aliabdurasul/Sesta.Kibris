/**
 * GET /api/cron/check-timeouts
 * Cron job — cancel PENDING orders older than 30 minutes.
 * Called by Vercel Cron (see vercel.json) every 5 minutes.
 * Protected by CRON_SECRET header.
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env["CRON_SECRET"];

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing env" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: timedOut, error } = await admin
    .from("orders")
    .select("id")
    .eq("status", "PENDING")
    .lt("created_at", cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!timedOut || timedOut.length === 0) {
    return NextResponse.json({ cancelled: 0 });
  }

  const ids = timedOut.map((o: { id: string }) => o.id);

  await admin.from("orders").update({ status: "CANCELLED" }).in("id", ids);

  await admin.from("order_status_log").insert(
    ids.map((id: string) => ({
      order_id: id,
      status: "CANCELLED",
      actor_role: "system",
      note: "Otomatik iptal: 30 dakika zaman aşımı",
    })),
  );

  return NextResponse.json({ cancelled: ids.length });
}
