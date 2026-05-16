/**
 * /admin/actors/new-courier — server page loads merchants for dropdown.
 */
import { createServerClient } from "@/lib/supabase/server";
import { NewCourierForm, type MerchantOption } from "./NewCourierForm";
import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];

async function getMerchantsForSelect(): Promise<MerchantOption[]> {
  const supabase = await createServerClient();
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
