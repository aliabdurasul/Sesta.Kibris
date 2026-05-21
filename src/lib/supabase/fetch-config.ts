/** Shared fetch with timeout for Supabase clients (edge-safe). */
const FETCH_TIMEOUT_MS = 15_000;

export function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}
