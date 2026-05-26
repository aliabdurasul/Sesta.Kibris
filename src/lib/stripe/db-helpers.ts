/**
 * Small helpers for Stripe MVP Supabase queries.
 *
 * PostgREST embeds (e.g. merchants(name)) may return an object or an array
 * depending on cardinality — this normalizes both shapes for UI code.
 */

export type RelatedMerchant = { name: string; slug?: string };

export function unwrapRelated<T extends Record<string, unknown>>(
  value: T | T[] | null | undefined,
): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
