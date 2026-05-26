/**
 * Small payment helpers shared by checkout and webhooks.
 *
 * applicationFeeAmount is legacy (Connect era) — optional for admin estimates only.
 */

/** MVP platform take rate (10%). */
export const MVP_APPLICATION_FEE_BPS = 1000; // 10.00%

/** Compute platform fee in kuruş (integer math, no floats). */
export function applicationFeeAmount(totalKurus: number): number {
  return Math.round((totalKurus * MVP_APPLICATION_FEE_BPS) / 10_000);
}

/** Format kuruş for display: 4500 → "45.00" */
export function formatTryFromKurus(kurus: number): string {
  return (kurus / 100).toFixed(2);
}

/** Stripe Checkout expects smallest currency unit (kuruş for TRY). */
export function assertPositiveAmount(kurus: number, label = "amount"): void {
  if (!Number.isInteger(kurus) || kurus <= 0) {
    throw new Error(`${label} must be a positive integer (kuruş)`);
  }
}
