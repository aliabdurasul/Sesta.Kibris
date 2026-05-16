/**
 * /setup-admin — First-run admin setup wizard
 *
 * This is the single entry point for creating the first platform admin.
 * It permanently disables itself once any admin exists in the system.
 *
 * FLOW:
 *   1. Server checks for existing admins (service role — no JWT required)
 *   2. If admin exists → redirect to /auth/login (bootstrap complete)
 *   3. If no admin → render SetupAdminForm
 *   4. SetupAdminForm creates admin via Auth Admin API + one-time temp password (no invite email)
 *
 * SECURITY:
 *   - Admin existence check is server-side only (service role)
 *   - No client can bypass this check
 *   - After first admin → page shows "already configured" and links to login
 *   - Form action itself also double-checks admin count (TOCTOU protection)
 *
 * This page is intentionally NOT linked from any UI.
 * It is only accessed by the person deploying the system for the first time.
 */
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SetupAdminForm } from "./SetupAdminForm";
import type { Database } from "@/types/database";

export const metadata = {
  title: "Sistem Kurulumu — SestaKıbrıs",
};

// Force dynamic — this page checks live admin count on every request
export const dynamic = "force-dynamic";

async function adminExists(): Promise<boolean> {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    // If env vars are missing, block bootstrap (misconfigured deployment)
    return true;
  }

  const adminClient = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.auth.admin.listUsers({
    perPage: 1000,
  });

  if (error) return true; // Fail closed — block bootstrap on error

  return data.users.some(
    (u) =>
      (u.app_metadata as Record<string, string> | undefined)?.["role"] ===
      "admin",
  );
}

export default async function SetupAdminPage() {
  const hasAdmin = await adminExists();

  // Already configured → redirect to login
  if (hasAdmin) {
    redirect("/auth/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🔑</div>
          <h1 className="text-2xl font-bold text-white">SestaKıbrıs</h1>
          <p className="mt-1 text-sm text-gray-400">Sistem İlk Kurulum</p>
        </div>

        <div className="mb-4 rounded-xl bg-amber-900/40 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-700/50">
          Bu sayfa yalnızca sistem ilk kurulumunda kullanılır ve sadece bir kez
          çalışır.
        </div>

        <SetupAdminForm />
      </div>
    </main>
  );
}
