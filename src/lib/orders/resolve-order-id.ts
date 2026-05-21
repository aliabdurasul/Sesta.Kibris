const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Normalize create-order / API response to a single order id. */
export function resolveOrderIdFromCreateResponse(
  payload: Record<string, unknown>,
): string | null {
  const direct = payload["order_id"];
  if (typeof direct === "string" && UUID_RE.test(direct)) return direct;

  const nested = payload["order"];
  if (nested && typeof nested === "object") {
    const id = (nested as { id?: unknown }).id;
    if (typeof id === "string" && UUID_RE.test(id)) return id;
  }

  return null;
}

export function isValidOrderId(value: string): boolean {
  return UUID_RE.test(value);
}
