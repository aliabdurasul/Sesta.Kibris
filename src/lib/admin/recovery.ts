/**
 * Operational recovery for the canonical first admin (bootstrap stays locked).
 *
 * Used by:
 *   - POST /api/admin/reset-admin-password (Bearer CRON_SECRET)
 *   - scripts/reset-admin-password.ts
 *
 * Does NOT create users, reopen /setup-admin, or delete accounts.
 */
import { randomBytes } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

export function generateTemporaryPassword(): string {
  return randomBytes(24).toString("base64url");
}

export function createServiceRoleClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Oldest user with app_metadata.role === "admin" (canonical first admin).
 */
export async function findCanonicalAdminUser(
  admin: SupabaseClient<Database>,
): Promise<{ id: string; email: string } | null> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const admins = data.users
    .filter(
      (u) =>
        (u.app_metadata as Record<string, string> | undefined)?.["role"] ===
        "admin",
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  const first = admins[0];
  if (!first?.id) return null;

  return { id: first.id, email: first.email ?? "" };
}

export type ResetAdminResult =
  | { ok: true; userId: string; email: string; temporaryPassword: string }
  | {
      ok: false;
      code: "no_admin" | "reset_failed" | "misconfigured";
      message: string;
    };

/**
 * Resets password on the existing canonical admin and forces rotation at next login.
 * Temporary password is returned once to the caller — never logged.
 */
export async function resetExistingAdminPassword(): Promise<ResetAdminResult> {
  let admin: SupabaseClient<Database>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return {
      ok: false,
      code: "misconfigured",
      message: "Supabase service role is not configured.",
    };
  }

  let canonical: { id: string; email: string } | null;
  try {
    canonical = await findCanonicalAdminUser(admin);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, code: "reset_failed", message };
  }

  if (!canonical) {
    return {
      ok: false,
      code: "no_admin",
      message:
        "No admin user found. Use /setup-admin only when no admin exists yet.",
    };
  }

  const temporaryPassword = generateTemporaryPassword();

  const { error } = await admin.auth.admin.updateUserById(canonical.id, {
    password: temporaryPassword,
    user_metadata: { password_change_required: true },
  });

  if (error) {
    log.error("admin.recovery.reset_failed", {
      userId: canonical.id,
      reason: error.message,
    });
    return {
      ok: false,
      code: "reset_failed",
      message: error.message,
    };
  }

  log.info("admin.recovery.password_reset", {
    userId: canonical.id,
    email: canonical.email,
  });

  return {
    ok: true,
    userId: canonical.id,
    email: canonical.email,
    temporaryPassword,
  };
}
