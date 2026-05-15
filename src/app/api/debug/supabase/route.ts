/**
 * GET /api/debug/supabase
 *
 * Phase 0.5 health check endpoint.
 * Returns environment status, Supabase connection status, and session status.
 *
 * Protected by CRON_SECRET header to prevent public access.
 * Call with: Authorization: Bearer <CRON_SECRET>
 *
 * NOTE: This endpoint is intentional and exists for runtime debugging.
 * It does NOT expose any secrets — only status booleans and masked values.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Require secret to prevent public access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];
  const expectedToken = cronSecret ? `Bearer ${cronSecret}` : null;

  if (!expectedToken || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report: Record<string, unknown> = {};

  // 1. Environment check
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  report["env"] = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl
      ? `${supabaseUrl.slice(0, 30)}...`
      : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey
      ? `${anonKey.slice(0, 20)}...`
      : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? "SET (masked)" : "MISSING",
    CRON_SECRET: cronSecret ? "SET (masked)" : "MISSING",
    NEXT_PUBLIC_APP_ENV: process.env["NEXT_PUBLIC_APP_ENV"] ?? "NOT SET",
  };

  report["env_ok"] =
    Boolean(supabaseUrl) && Boolean(anonKey) && Boolean(serviceRoleKey);

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      {
        status: "FAIL",
        reason: "Missing required Supabase environment variables",
        report,
      },
      { status: 500 },
    );
  }

  // 2. Supabase connection check — query merchants table (no auth needed, RLS allows public read)
  let dbStatus: "ok" | "error" = "error";
  let dbError: string | null = null;
  let merchantCount = 0;
  let productCount = 0;
  let customerCount = 0;
  let courierCount = 0;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only in route handler
        },
      },
    });

    const [merchants, products, customers, couriers] = await Promise.all([
      supabase
        .from("merchants")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("couriers")
        .select("id", { count: "exact", head: true }),
    ]);

    if (merchants.error) throw new Error(`merchants: ${merchants.error.message}`);

    dbStatus = "ok";
    merchantCount = merchants.count ?? 0;
    productCount = products.count ?? 0;
    customerCount = customers.count ?? 0;
    courierCount = couriers.count ?? 0;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  report["database"] = {
    status: dbStatus,
    error: dbError,
    seed_data: {
      merchants: merchantCount,
      products: productCount,
      customers: customerCount,
      couriers: courierCount,
    },
    seed_ok:
      merchantCount > 0 &&
      productCount > 0 &&
      customerCount > 0 &&
      courierCount > 0,
  };

  // 3. Session check — is there an active session in this request?
  let sessionStatus: "authenticated" | "unauthenticated" | "error" =
    "unauthenticated";
  let sessionRole: string | null = null;
  let sessionError: string | null = null;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      sessionError = error.message;
    } else if (user) {
      sessionStatus = "authenticated";
      sessionRole =
        (user.app_metadata as Record<string, string> | undefined)?.[
          "role"
        ] ?? "no role in app_metadata";
    }
  } catch (err) {
    sessionStatus = "error";
    sessionError = err instanceof Error ? err.message : String(err);
  }

  report["session"] = {
    status: sessionStatus,
    role: sessionRole,
    error: sessionError,
  };

  // 4. Overall verdict
  const allOk = report["env_ok"] === true && dbStatus === "ok";

  return NextResponse.json(
    {
      status: allOk ? "PASS" : "FAIL",
      timestamp: new Date().toISOString(),
      report,
    },
    { status: allOk ? 200 : 500 },
  );
}
