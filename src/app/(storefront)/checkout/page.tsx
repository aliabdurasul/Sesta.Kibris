/**
 * Checkout page — /checkout
 *
 * Guest flow: GuestCheckoutForm (no auth) — POST create-order with guest fields.
 * Optional login for saved addresses via CheckoutForm.
 *
 * Authenticated customer flow: shows order form with saved addresses.
 * Authenticated non-customer: redirected to their dashboard.
 *
 * The actual order creation calls /functions/v1/create-order Edge Function.
 */
import { getSession } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./CheckoutForm";
import { GuestCheckoutForm } from "./GuestCheckoutForm";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

export const metadata = {
  title: "Sipariş Ver — SestaKıbrıs",
};

type AddressRow = Database["public"]["Tables"]["customer_addresses"]["Row"];

async function getCustomerAddresses(userId: string): Promise<
  Pick<
    AddressRow,
    "id" | "label" | "full_address" | "district" | "is_default"
  >[]
> {
  const supabase = await createServerClient();
  const customerRes = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const customerId = (customerRes.data as { id: string } | null)?.id;
  if (!customerId) return [];

  const addressRes = await supabase
    .from("customer_addresses")
    .select("id, label, full_address, district, is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false });

  return (addressRes.data ?? []) as Pick<
    AddressRow,
    "id" | "label" | "full_address" | "district" | "is_default"
  >[];
}

export default async function CheckoutPage() {
  const session = await getSession();

  // ── Guest → full checkout without account ─────────────────────────────────
  if (!session) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-xl">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/merchants"
              className="text-sm text-blue-600 hover:underline"
            >
              ← Alışverişe dön
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Sipariş Ver</h1>
          </div>
          <GuestCheckoutForm />
        </div>
      </main>
    );
  }

  // ── Logged-in but not a customer → go to their dashboard ─────────────────
  if (session.role !== "customer") {
    redirect(`/${session.role === "merchant" ? "merchant" : session.role}`);
  }

  // ── Authenticated customer → show order form ──────────────────────────────
  const addresses = await getCustomerAddresses(session.id);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/merchants"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Alışverişe dön
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Siparişi Onayla</h1>
        </div>
        <CheckoutForm savedAddresses={addresses} userId={session.id} />
      </div>
    </main>
  );
}
