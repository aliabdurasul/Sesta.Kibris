/**
 * Stripe environment validation.
 *
 * WHY: Payment code must fail loudly at startup if keys are missing —
 * never silently skip charges or accept webhooks without verification.
 */

export interface StripeEnv {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  appUrl: string;
}

const HELP: Record<keyof Omit<StripeEnv, "appUrl">, string> = {
  secretKey:
    "Missing STRIPE_SECRET_KEY. Add it to .env.local from Stripe Dashboard → Developers → API keys (test mode).",
  publishableKey:
    "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Add the pk_test_... key to .env.local from the same API keys page.",
  webhookSecret:
    "Missing STRIPE_WEBHOOK_SECRET. Run: stripe listen --forward-to localhost:3000/api/stripe/webhooks — then copy the whsec_... value into .env.local.",
};

function requireEnv(name: string, help: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(help);
  }
  return value;
}

/** Server-only: secret key + webhook secret + site URL for redirects. */
export function getStripeServerEnv(): Pick<
  StripeEnv,
  "secretKey" | "webhookSecret" | "appUrl"
> {
  return {
    secretKey: requireEnv("STRIPE_SECRET_KEY", HELP.secretKey),
    webhookSecret: requireEnv("STRIPE_WEBHOOK_SECRET", HELP.webhookSecret),
    appUrl: (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000"
    ).replace(/\/$/, ""),
  };
}

/** Client-safe publishable key (browser Payment Element / future use). */
export function getStripePublishableKey(): string {
  return requireEnv(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    HELP.publishableKey,
  );
}
