/**
 * /staff — removed in Phase 1 stabilization.
 *
 * This route is not in the Phase 1 role model (customer/merchant/courier/admin).
 * Staff entry is handled via /auth/login with redirectTo parameter.
 *
 * Operational staff bookmarks:
 *   Merchant:  /auth/login?redirectTo=/merchant
 *   Courier:   /auth/login?redirectTo=/courier
 *   Admin:     /auth/login?redirectTo=/admin
 */
import { redirect } from "next/navigation";

export default function StaffPage() {
  redirect("/auth/login");
}
