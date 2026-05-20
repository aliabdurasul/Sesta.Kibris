"use server";

/**
 * Merchant: toggle is_open (accepting orders now).
 * is_active is admin-only (platform visibility).
 */
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";

export async function setMerchantOpen(
  isOpen: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("merchant");

  const supabase = await createServerClient();

  let merchantId = session.merchantId;
  if (!merchantId) {
    const { data: row } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", session.id)
      .maybeSingle();
    merchantId = (row as { id: string } | null)?.id;
  }

  if (!merchantId) {
    return { ok: false, error: "Market kaydı bulunamadı." };
  }

  const { error } = await (
    supabase as unknown as {
      from: (table: string) => {
        update: (values: { is_open: boolean }) => {
          eq: (
            col: string,
            val: string,
          ) => Promise<{ error: { message: string } | null }>;
        };
      };
    }
  )
    .from("merchants")
    .update({ is_open: isOpen })
    .eq("id", merchantId);

  if (error) {
    log.error("merchant.set_open", {
      merchantId,
      reason: error.message,
    });
    return { ok: false, error: error.message };
  }

  log.info("merchant.set_open", { merchantId, isOpen });
  revalidatePath("/merchant");
  revalidatePath("/merchants");

  const { data: row } = await supabase
    .from("merchants")
    .select("slug")
    .eq("id", merchantId)
    .maybeSingle();

  const slug = (row as { slug: string } | null)?.slug;
  if (slug) {
    revalidatePath(`/merchants/${slug}`);
  }

  return { ok: true };
}
