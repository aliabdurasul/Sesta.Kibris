"use server";

/**
 * Server Action: Create the first platform admin via email invite.
 *
 * SECURITY MODEL:
 *   - Only executes when zero admins exist in the system.
 *   - Checks admin count before AND after the invite (TOCTOU double-check).
 *   - Uses Supabase inviteUserByEmail — admin sets their own password via email.
 *   - No plaintext passwords generated or stored.
 *   - Requires SUPABASE_SERVICE_ROLE_KEY — only runs server-side.
 *
 * AFTER FIRST ADMIN:
 *   - This action returns an error for all subsequent calls.
 *   - Bootstrap is permanently disabled once any admin exists.
 *   - Further admins must be created via the admin panel (future feature).
 *
 * AUDIT:
 *   - Logs the creation event with timestamp and email (not password).
 */
import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

export type SetupAdminState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase service role env vars");
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Returns the count of users with app_metadata.role = "admin".
 * Uses listUsers — safe for small Phase 1 user counts.
 */
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

export async function setupAdminAction(
  _prevState: SetupAdminState,
  formData: FormData,
): Promise<SetupAdminState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Geçerli bir e-posta adresi girin." };
  }

  try {
    // ── Pre-check: abort if admin already exists ───────────────────────────
    const existingCount = await countAdmins();
    if (existingCount > 0) {
      log.warn("setup_admin.already_configured", { email });
      return {
        status: "error",
        message:
          "Sistem zaten yapılandırılmış. Admin hesabı oluşturmak için mevcut admin ile iletişime geçin.",
      };
    }

    const admin = createAdminClient();

    // ── Invite user (they set their own password via email link) ───────────
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      if (inviteError.message.toLowerCase().includes("already registered")) {
        // User exists but has no admin role — elevate them
        const { data: listData } = await admin.auth.admin.listUsers({
          perPage: 1000,
        });
        const existingUser = listData?.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );

        if (!existingUser) {
          return { status: "error", message: "Kullanıcı bulunamadı." };
        }

        const existingRole = (
          existingUser.app_metadata as Record<string, string> | undefined
        )?.["role"];

        if (existingRole && existingRole !== "") {
          return {
            status: "error",
            message: `Bu hesap zaten "${existingRole}" rolüne sahip.`,
          };
        }

        // No role — safe to elevate
        await admin.auth.admin.updateUserById(existingUser.id, {
          app_metadata: { role: "admin" },
        });

        log.info("setup_admin.elevated_existing", {
          userId: existingUser.id,
          email,
        });

        return { status: "success", email };
      }

      log.error("setup_admin.invite_failed", {
        email,
        reason: inviteError.message,
      });
      return {
        status: "error",
        message: `Davet gönderilemedi: ${inviteError.message}`,
      };
    }

    const newUserId = inviteData.user.id;

    // ── Set admin role on the new user ─────────────────────────────────────
    const { error: updateError } = await admin.auth.admin.updateUserById(
      newUserId,
      { app_metadata: { role: "admin" } },
    );

    if (updateError) {
      // Rollback: delete the invited user to avoid orphan without role
      await admin.auth.admin.deleteUser(newUserId);
      log.error("setup_admin.role_set_failed", {
        userId: newUserId,
        email,
        reason: updateError.message,
      });
      return {
        status: "error",
        message: "Admin rolü atanamadı. Lütfen tekrar deneyin.",
      };
    }

    // ── Post-check: confirm exactly one admin now exists ───────────────────
    const finalCount = await countAdmins();
    if (finalCount !== 1) {
      log.warn("setup_admin.unexpected_count", { finalCount, email });
    }

    log.info("setup_admin.success", { userId: newUserId, email });

    return { status: "success", email };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    log.error("setup_admin.unexpected", { email, reason });
    return {
      status: "error",
      message: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}
