/**
 * Recover access to the existing canonical admin (no bootstrap, no second admin).
 *
 * Usage (from project root, with .env.local present):
 *   pnpm admin:reset-password
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename: string): void {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

async function main(): Promise<void> {
  const { resetExistingAdminPassword } = await import(
    "../src/lib/admin/recovery.js"
  );

  const result = await resetExistingAdminPassword();

  if (!result.ok) {
    console.error(`[reset-admin-password] ${result.message}`);
    process.exit(1);
  }

  console.log("");
  console.log("Admin password reset successful.");
  console.log("");
  console.log(`  Email:              ${result.email}`);
  console.log(`  Temporary password: ${result.temporaryPassword}`);
  console.log("");
  console.log("  (Save the temporary password now — it will not be shown again.)");
  console.log("");
  console.log("  Next steps:");
  console.log("    1. Open /auth/login");
  console.log("    2. Sign in with the email and temporary password above");
  console.log("    3. Set a permanent password at /auth/setup-password");
  console.log("    4. Continue to /admin");
  console.log("");
}

main().catch((err: unknown) => {
  console.error(
    "[reset-admin-password]",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
});
