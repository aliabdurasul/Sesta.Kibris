/**
 * POST /api/admin/reset-admin-password
 *
 * Operational recovery when the canonical admin exists but the password is unknown.
 * Bootstrap (/setup-admin) remains locked — this only resets the existing admin.
 *
 * Security:
 *   - POST only
 *   - Authorization: Bearer <CRON_SECRET> (same secret as cron jobs)
 *   - Service role used server-side only
 *   - Temporary password returned once in JSON — not logged
 *
 * Remove this route after production stabilizes if you rely on the CLI script only.
 */
import { NextResponse, type NextRequest } from "next/server";

import { resetExistingAdminPassword } from "@/lib/admin/recovery";

function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

function unauthorized(): NextResponse {
  return json({ error: "Unauthorized" }, 401);
}

export function GET(): NextResponse {
  return json({ error: "Method not allowed" }, 405);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env["CRON_SECRET"];
  if (!secret) {
    return json({ error: "Server misconfiguration" }, 500);
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return unauthorized();
  }

  const result = await resetExistingAdminPassword();

  if (!result.ok) {
    switch (result.code) {
      case "no_admin":
        return json({ error: result.message }, 404);
      case "misconfigured":
        return json({ error: result.message }, 500);
      default:
        return json({ error: result.message }, 502);
    }
  }

  return json({
    ok: true,
    email: result.email,
    temporaryPassword: result.temporaryPassword,
    nextSteps: [
      "Sign in at /auth/login with the email and temporary password.",
      "You will be redirected to /auth/setup-password to set a permanent password.",
      "After that you can access /admin.",
    ],
  });
}
