/**
 * RETIRED — /api/auth/bootstrap-admin
 *
 * This endpoint has been replaced by /setup-admin (first-run wizard).
 *
 * REASON:
 *   The previous implementation relied on BOOTSTRAP_ADMIN_EMAIL and CRON_SECRET
 *   environment variables for authentication. This created operational risk:
 *   env vars could change or be absent, making admin creation unpredictable.
 *
 * NEW FLOW:
 *   Navigate to /setup-admin in your browser.
 *   The wizard checks for existing admins, creates the first admin via
 *   Supabase invite email, and permanently disables itself.
 *
 * This route now returns 410 Gone to prevent any tooling from calling the
 * old endpoint expecting the previous behavior.
 */
import { NextResponse } from "next/server";

const RETIRED_MESSAGE = {
  error: "This endpoint has been retired.",
  migration: "Use /setup-admin for first-run admin setup.",
};

export function GET() {
  return NextResponse.json(RETIRED_MESSAGE, { status: 410 });
}

export function POST() {
  return NextResponse.json(RETIRED_MESSAGE, { status: 410 });
}
