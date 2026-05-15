/**
 * POST /api/auth/bootstrap-admin
 *
 * One-time secure endpoint to elevate a user to admin role.
 * Protected by CRON_SECRET (reuses the same secret — no extra env needed).
 *
 * Body: { "email": "admin@example.com" }
 *
 * Rules:
 *   - Only works if BOOTSTRAP_ADMIN_EMAIL matches the request body email
 *   - If user already has a role, returns 409 (won't downgrade/overwrite)
 *   - Requires Authorization: Bearer <CRON_SECRET> header
 *
 * Usage (one-time CLI call):
 *   curl -X POST https://your-domain/api/auth/bootstrap-admin \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"your-admin@email.com"}'
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) return json({ error: "Server misconfigured" }, 500);

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${cronSecret}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  // ── Bootstrap email guard ─────────────────────────────────────────────────
  const bootstrapEmail = process.env["BOOTSTRAP_ADMIN_EMAIL"]?.trim();
  if (!bootstrapEmail) {
    return json({ error: "BOOTSTRAP_ADMIN_EMAIL not configured" }, 400);
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const targetEmail = body.email?.trim().toLowerCase();
  if (!targetEmail) {
    return json({ error: "email is required" }, 400);
  }

  if (targetEmail !== bootstrapEmail.toLowerCase()) {
    return json({ error: "Email does not match BOOTSTRAP_ADMIN_EMAIL" }, 403);
  }

  // ── Find user by email ────────────────────────────────────────────────────
  const admin = createAdminClient();
  const { data: listData, error: listError } =
    await admin.auth.admin.listUsers();

  if (listError) {
    return json({ error: "Failed to list users" }, 500);
  }

  const user = listData.users.find(
    (u) => u.email?.toLowerCase() === targetEmail,
  );

  if (!user) {
    return json({ error: "User not found. Register first, then bootstrap." }, 404 );
  }

  // ── Guard: don't overwrite existing role ─────────────────────────────────
  const existingRole = (
    user.app_metadata as Record<string, string> | undefined
  )?.["role"];

  if (existingRole && existingRole !== "") {
    return json(
      { ok: false, message: `User already has role: ${existingRole}` },
      409,
    );
  }

  // ── Elevate to admin ──────────────────────────────────────────────────────
  const { error: updateError } = await admin.auth.admin.updateUserById(
    user.id,
    { app_metadata: { role: "admin" } },
  );

  if (updateError) {
    return json({ error: "Failed to set admin role" }, 500);
  }

  return json({
    ok: true,
    message: `User ${targetEmail} elevated to admin`,
    userId: user.id,
  });
}

export async function GET(): Promise<NextResponse> {
  return json({ error: "Method Not Allowed. Use POST." }, 405);
}
