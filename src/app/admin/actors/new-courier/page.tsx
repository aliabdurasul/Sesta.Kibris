/**
 * /admin/actors/new-courier — server page loads merchants for dropdown.
 */
import { createAdminServerClient } from "@/lib/supabase/admin";
import { NewCourierForm, type MerchantOption } from "./NewCourierForm";
import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];

async function getMerchantsForSelect(): Promise<MerchantOption[]> {
  const supabase = createAdminServerClient();
  const { data } = await supabase
    .from("merchants")
    .select("id, name")
    .order("name", { ascending: true });

  return (data ?? []) as Pick<MerchantRow, "id" | "name">[];
}

export default async function NewCourierPage() {
  const merchants = await getMerchantsForSelect();
  return <NewCourierForm merchants={merchants} />;
}
