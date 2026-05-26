/**
 * Stripe feature flags — MIN-LAUNCH (default).
 *
 * Platform payments (default):
 *   - Unset or ENABLE_STRIPE_CONNECT=false
 *   - Merchants only toggle accepts_online_payment
 *   - All card charges use STRIPE_SECRET_KEY on the platform account
 *
 * Connect (legacy, off by default):
 *   - ENABLE_STRIPE_CONNECT=true only for future re-enable
 */
export function isStripeConnectEnabled(): boolean {
  const raw = process.env["ENABLE_STRIPE_CONNECT"]?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

/** True when card checkout uses the platform Stripe account (production default). */
export function isPlatformCardCheckoutEnabled(): boolean {
  return !isStripeConnectEnabled();
}
