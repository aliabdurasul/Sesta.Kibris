/**
 * Client-safe Supabase fetch helpers — preserve state on failed refetch.
 */

const IS_DEV = process.env.NODE_ENV === "development";

export function logSupabaseResult(
  label: string,
  result: { data: unknown; error: { message: string } | null },
): void {
  if (!IS_DEV) return;
  if (result.error) {
    console.error(`[${label} ERROR]`, result.error);
  } else {
    const count = Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0;
    console.log(`[${label}]`, count, "rows");
  }
}

/** Throw on error so realtime refetch does not overwrite SSR state with []. */
export function assertSupabaseData<T>(
  label: string,
  result: { data: T | null; error: { message: string } | null },
): T {
  logSupabaseResult(label, result as { data: unknown; error: { message: string } | null });
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return (result.data ?? []) as T;
}
