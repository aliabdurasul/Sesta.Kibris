/**
 * Environment variable validation.
 * Fails loudly if required variables are missing.
 * Import this in server-side code to access typed env vars.
 */
import { getSiteUrl } from "@/lib/site-config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Add it to .env.local (for development) or your deployment environment.`,
    );
  }
  return value;
}

// Public vars (safe for client-side usage)
const publicSiteUrl = getSiteUrl();

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  /** Canonical public origin — use for SEO; set NEXT_PUBLIC_SITE_URL on Vercel. */
  NEXT_PUBLIC_SITE_URL: publicSiteUrl,
  /** @deprecated Use NEXT_PUBLIC_SITE_URL; kept for backward compatibility. */
  NEXT_PUBLIC_APP_URL: publicSiteUrl,
  NEXT_PUBLIC_APP_ENV: process.env["NEXT_PUBLIC_APP_ENV"] ?? "development",
} as const;

// Server-only vars — NEVER import this in client components
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  CRON_SECRET: requireEnv("CRON_SECRET"),
} as const;
