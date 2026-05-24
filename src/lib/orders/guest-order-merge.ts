/**
 * Future: link guest orders to a registered account after signup.
 *
 * Example (not called in MVP):
 *   UPDATE orders SET customer_id = $userId
 *   WHERE guest_token = $token AND customer_id IS NULL;
 */
export type GuestOrderMergeParams = {
  userId: string;
  guestToken: string;
};

/** Placeholder for Phase 2 account merge — implement with service role + audit log. */
export async function linkGuestOrdersToUser(
  _params: GuestOrderMergeParams,
): Promise<{ linked: number }> {
  return { linked: 0 };
}
