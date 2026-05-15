/**
 * Checkout page — /checkout
 * Server Component: loads authenticated user's saved addresses.
 * Redirects to /auth/login if not authenticated (customer role required).
 * The actual order creation calls /supabase/functions/v1/create-order.
 */
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./CheckoutForm";

export const metadata = {
  title: "Sipariş Ver — SestaKıbrıs",
};

import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
type AddressRow = Database["public"]["Tables"]["customer_addresses"]["Row"];

async function getCustomerAddresses(userId: string): Promise<
  Pick<AddressRow, "id" | "label" | "full_address" | "district" | "is_default">[]
> {
  const supabase = await createServerClient();
  const customerRes = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .single();

  const customerId = (customerRes.data as { id: string } | null)?.id;
  if (!customerId) return [];

  const addressRes = await supabase
    .from("customer_addresses")
    .select("id, label, full_address, district, is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false });

  return (addressRes.data ?? []) as Pick<AddressRow, "id" | "label" | "full_address" | "district" | "is_default">[];
}

export default async function CheckoutPage() {
  const session = await getSession();

  if (!session || session.role !== "customer") {
    redirect("/auth/login?redirectTo=/checkout");
  }

  const addresses = await getCustomerAddresses(session.id);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Siparişi Onayla</h1>
        <CheckoutForm
          savedAddresses={addresses}
          userId={session.id}
        />
      </div>
    </main>
  );
}
