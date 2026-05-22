"use server";

/**
 * Admin: toggle merchant platform status (is_active) and operational open (is_open).
 */
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/logger";

function adminDbUntyped() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function setMerchantActive(
  merchantId: string,
  isActive: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("admin");
  const { error } = await adminDbUntyped()
    .from("merchants")
    .update({ is_active: isActive })
    .eq("id", merchantId);

  if (error) {
    log.error("admin.merchant.set_active", { merchantId, reason: error.message });
    return { ok: false, error: error.message };
  }

  log.info("admin.merchant.set_active", { merchantId, isActive });
  revalidatePath("/admin/actors");
  revalidatePath("/market");
  revalidatePath("/");
  return { ok: true };
}

export async function setMerchantOpen(
  merchantId: string,
  isOpen: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("admin");
  const { error } = await adminDbUntyped()
    .from("merchants")
    .update({ is_open: isOpen })
    .eq("id", merchantId);

  if (error) {
    log.error("admin.merchant.set_open", { merchantId, reason: error.message });
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/actors");
  return { ok: true };
}
