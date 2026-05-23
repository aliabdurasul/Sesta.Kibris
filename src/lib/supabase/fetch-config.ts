/** Shared fetch with timeout + limited retry for Supabase clients. */
const FETCH_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 2;

function isRetryableFetchError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("enotfound") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("network") ||
    msg.includes("abort")
  );
}

export function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const run = (attempt: number): Promise<Response> => {
    const signal =
      init?.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS);

    return fetch(input, { ...init, signal }).catch((err) => {
      if (attempt < MAX_ATTEMPTS && isRetryableFetchError(err)) {
        return run(attempt + 1);
      }
      throw err;
    });
  };

  return run(1);
}
