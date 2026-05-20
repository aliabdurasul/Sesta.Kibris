"use server";

/**
 * Server Action: Deterministic first-admin bootstrap (NO invite email).
 *
 * FLOW:
 *   1. Pre-check: zero users with app_metadata.role === "admin"
 *   2. Create user via Admin API: email_confirm + role + password_change_required
 *   3. Cryptographically secure one-time temporary password (shown once in UI only)
 *   4. Post-check: exactly one admin exists
 *
 * SECURITY:
 *   - Temporary password is never logged or persisted beyond the HTTP response to the operator
 *   - Operator must log in and complete /auth/setup-password to clear the flag
 *   - Service role key required — server-side only
 *
 * IF admin already exists → error (TOCTOU also re-checked after create)
 */
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";
import type { SetupAdminState } from "./types";

// Re-export so callers that previously imported from this file still compile.
// Client components import the type from ./types directly.
export type { SetupAdminState } from "./types";

function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase service role env vars");
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function countAdmins(): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`Failed to list users: ${error.message}`);
  return data.users.filter(
    (u) =>
      (u.app_metadata as Record<string, string> | undefined)?.["role"] ===
      "admin",
  ).length;
}

/** One-time bootstrap password; not logged or stored server-side after return. */
function generateTemporaryPassword(): string {
  return randomBytes(24).toString("base64url");
}

export async function setupAdminAction(
  _prevState: SetupAdminState,
  formData: FormData,
): Promise<SetupAdminState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Geçerli bir e-posta adresi girin." };
  }

  try {
    const before = await countAdmins();
    if (before > 0) {
      log.warn("setup_admin.blocked_existing", { email });
      return {
        status: "error",
        message:
          "Sistem zaten yapılandırılmış. İlk admin oluşturulduktan sonra bu akış devre dışıdır.",
      };
    }

    const admin = createAdminClient();
    const temporaryPassword = generateTemporaryPassword();

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        app_metadata: { role: "admin" },
        user_metadata: { password_change_required: true },
      });

    if (createError || !created.user) {
      const msg = createError?.message ?? "Kullanıcı oluşturulamadı.";
      if (msg.toLowerCase().includes("already")) {
        return {
          status: "error",
          message:
            "Bu e-posta ile zaten bir hesap var. İlk admin için yeni ve benzersiz bir e-posta kullanın.",
        };
      }
      log.error("setup_admin.create_failed", { email, reason: msg });
      return { status: "error", message: `Admin oluşturulamadı: ${msg}` };
    }

    const userId = created.user.id;

    const after = await countAdmins();
    if (after !== 1) {
      log.warn("setup_admin.unexpected_admin_count", {
        userId,
        email,
        count: after,
      });
    }

    log.info("setup_admin.success", { userId, email });

    return {
      status: "success",
      email,
      temporaryPassword,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    log.error("setup_admin.unexpected", { email, reason });
    return {
      status: "error",
      message: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}
