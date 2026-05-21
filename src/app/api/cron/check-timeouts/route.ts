/**
 * POST /api/cron/check-timeouts
 *
 * External cron endpoint — called by cron-job.org every 5 minutes.
 * Cancels PENDING orders that are older than 30 minutes.
 *
 * Security:
 *   - POST only (GET returns 405)
 *   - Requires: Authorization: Bearer <CRON_SECRET>
 *   - Returns 401 if header is missing or invalid — no internal details exposed
 *
 * Idempotency:
 *   - Uses `cron_lock` table to enforce minimum 4-minute gap between executions
 *   - Concurrent / overlapping calls within that window return 429
 *   - All DB writes are independent per-order (safe to retry on partial failure)
 *
 * Atomicity:
 *   - Each order is updated only if it is still PENDING at update time (.eq filter)
 *   - Status log insertion is independent; a missed log does NOT roll back the cancel
 *   - No partial state is possible: an order is either PENDING or CANCELLED
 *
 * Observability:
 *   - Returns JSON with scanned, cancelled, execution_ms, timestamp
 *   - Errors are logged with console.error for Vercel / hosting log drain
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { log } from "@/lib/logger";

// ─── Constants ────────────────────────────────────────────────────────────────

const PENDING_TIMEOUT_MINUTES = 30;
const MIN_RUN_INTERVAL_SECONDS = 240; // 4 min — prevents overlapping 5-min cron calls
const JOB_NAME = "check-timeouts";

// ─── Helper ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startMs = Date.now();

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  const secret = process.env["CRON_SECRET"];

  if (!secret) {
    console.error("[cron] CRON_SECRET env var is not set");
    return json({ error: "Server misconfiguration" }, 500);
  }

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  // ── 2. Env check ─────────────────────────────────────────────────────────
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[cron] Missing Supabase env vars");
    return json({ error: "Server misconfiguration" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── 3. Idempotency lock ──────────────────────────────────────────────────
  const { data: lockRow, error: lockReadError } = await admin
    .from("cron_lock")
    .select("last_run_at")
    .eq("job_name", JOB_NAME)
    .single();

  if (lockReadError) {
    console.error("[cron] Failed to read cron_lock:", lockReadError.message);
    return json({ error: "Lock read failed" }, 500);
  }

  const lastRunAt = lockRow
    ? new Date((lockRow as { last_run_at: string }).last_run_at).getTime()
    : 0;

  const secondsSinceLastRun = (Date.now() - lastRunAt) / 1000;

  if (secondsSinceLastRun < MIN_RUN_INTERVAL_SECONDS) {
    const retryAfter = Math.ceil(MIN_RUN_INTERVAL_SECONDS - secondsSinceLastRun);
    log.warn("cron.check_timeouts.skipped_too_soon", {
      secondsSinceLastRun: Math.floor(secondsSinceLastRun),
      minInterval: MIN_RUN_INTERVAL_SECONDS,
    });
    return json(
      {
        skipped: true,
        reason: "Too soon since last run",
        retry_after_seconds: retryAfter,
      },
      429,
    );
  }

  // Claim the lock immediately (before doing work)
  const runStartedAt = new Date().toISOString();
  const { error: lockWriteError } = await admin
    .from("cron_lock")
    .update({
      last_run_at: runStartedAt,
      last_run_by: request.headers.get("x-vercel-id") ?? "external",
      updated_at: runStartedAt,
    })
    .eq("job_name", JOB_NAME);

  if (lockWriteError) {
    console.error("[cron] Failed to claim lock:", lockWriteError.message);
    return json({ error: "Lock write failed" }, 500);
  }

  // ── 4. Find timed-out PENDING orders ────────────────────────────────────
  const cutoff = new Date(
    Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: timedOut, error: selectError } = await admin
    .from("orders")
    .select("id")
    .eq("status", "PENDING")
    .lt("created_at", cutoff);

  if (selectError) {
    console.error("[cron] Failed to query timed-out orders:", selectError.message);
    return json({ error: "Query failed" }, 500);
  }

  const scanned = timedOut?.length ?? 0;

  log.info("cron.check_timeouts.scanned", {
    scanned,
    timeoutMinutes: PENDING_TIMEOUT_MINUTES,
  });

  if (scanned === 0) {
    // Update observability counters even on no-op run
    await admin
      .from("cron_lock")
      .update({ last_scanned: 0, last_cancelled: 0, updated_at: new Date().toISOString() })
      .eq("job_name", JOB_NAME);

    // Still run HYBRID escalation when no PENDING timeouts
    let hybridEscalated = 0;
    const { data: hybridReady } = await admin
      .from("orders")
      .select(
        "id, ready_at, merchants!inner(delivery_mode, hybrid_assign_timeout_minutes)",
      )
      .eq("status", "READY")
      .is("assignment_escalated_at", null);

    if (hybridReady?.length) {
      const nowMs = Date.now();
      const ids: string[] = [];
      for (const row of hybridReady) {
        const m = row.merchants as
          | { delivery_mode: string; hybrid_assign_timeout_minutes: number }
          | { delivery_mode: string; hybrid_assign_timeout_minutes: number }[]
          | null;
        const merchant = Array.isArray(m) ? m[0] : m;
        const readyAt = row.ready_at as string | null;
        if (merchant?.delivery_mode !== "HYBRID" || !readyAt) continue;
        const deadline =
          new Date(readyAt).getTime() +
          (merchant.hybrid_assign_timeout_minutes ?? 15) * 60 * 1000;
        if (nowMs >= deadline) ids.push(row.id as string);
      }
      if (ids.length > 0) {
        const { data: updated } = await admin
          .from("orders")
          .update({ assignment_escalated_at: new Date().toISOString() })
          .in("id", ids)
          .eq("status", "READY")
          .select("id");
        hybridEscalated = updated?.length ?? 0;
      }
    }

    return json({
      ok: true,
      scanned: 0,
      cancelled: 0,
      hybrid_escalated: hybridEscalated,
      execution_ms: Date.now() - startMs,
      timestamp: runStartedAt,
    });
  }

  const ids = (timedOut ?? []).map((o: { id: string }) => o.id);

  // ── 5. Cancel orders (only if still PENDING — atomic guard) ─────────────
  // The double .eq("status", "PENDING") ensures we never overwrite a status
  // that changed between SELECT and UPDATE (e.g. customer confirmed mid-run).
  const { data: updatedOrders, error: updateError } = await admin
    .from("orders")
    .update({ status: "CANCELLED" })
    .in("id", ids)
    .eq("status", "PENDING") // atomic guard
    .select("id");

  if (updateError) {
    console.error("[cron] Failed to cancel orders:", updateError.message);
    return json({ error: "Update failed" }, 500);
  }

  const cancelledIds = (updatedOrders ?? []).map((o: { id: string }) => o.id);
  const cancelled = cancelledIds.length;

  log.info("cron.check_timeouts.cancelled", { scanned, cancelled });

  // ── 6. Append status log for each actually-cancelled order ───────────────
  if (cancelled > 0) {
    const { error: logError } = await admin.from("order_status_log").insert(
      cancelledIds.map((id: string) => ({
        order_id: id,
        status: "CANCELLED",
        actor_role: "system",
        actor_id: null,
        note: `Otomatik iptal: ${PENDING_TIMEOUT_MINUTES} dakika zaman aşımı`,
      })),
    );

    if (logError) {
      // Non-fatal: order is already cancelled. Log and continue.
      console.error("[cron] Status log insert failed (non-fatal):", logError.message);
    }
  }

  // ── 7. Update observability counters ────────────────────────────────────
  await admin
    .from("cron_lock")
    .update({
      last_scanned: scanned,
      last_cancelled: cancelled,
      updated_at: new Date().toISOString(),
    })
    .eq("job_name", JOB_NAME);

  // ── 8. HYBRID: flag READY orders past merchant assign window ─────────────
  let hybridEscalated = 0;
  const { data: hybridReady, error: hybridErr } = await admin
    .from("orders")
    .select(
      "id, ready_at, assignment_escalated_at, merchants!inner(delivery_mode, hybrid_assign_timeout_minutes)",
    )
    .eq("status", "READY")
    .is("assignment_escalated_at", null);

  if (!hybridErr && hybridReady?.length) {
    const nowMs = Date.now();
    const toEscalate: string[] = [];
    for (const row of hybridReady) {
      const m = row.merchants as
        | { delivery_mode: string; hybrid_assign_timeout_minutes: number }
        | { delivery_mode: string; hybrid_assign_timeout_minutes: number }[]
        | null;
      const merchant = Array.isArray(m) ? m[0] : m;
      const readyAt = row.ready_at as string | null;
      if (merchant?.delivery_mode !== "HYBRID" || !readyAt) continue;
      const deadline =
        new Date(readyAt).getTime() +
        (merchant.hybrid_assign_timeout_minutes ?? 15) * 60 * 1000;
      if (nowMs >= deadline) toEscalate.push(row.id as string);
    }
    if (toEscalate.length > 0) {
      const { data: updated } = await admin
        .from("orders")
        .update({ assignment_escalated_at: new Date().toISOString() })
        .in("id", toEscalate)
        .eq("status", "READY")
        .select("id");
      hybridEscalated = updated?.length ?? 0;
    }
  }

  const executionMs = Date.now() - startMs;
  log.info("cron.check_timeouts.done", {
    scanned,
    cancelled,
    hybridEscalated,
    executionMs,
  });

  return json({
    ok: true,
    scanned,
    cancelled,
    hybrid_escalated: hybridEscalated,
    execution_ms: executionMs,
    timestamp: runStartedAt,
  });
}

// ─── Reject all other HTTP methods ────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return json({ error: "Method Not Allowed. Use POST." }, 405);
}
