/**
 * Checkout page — /checkout
 *
 * Guest: GuestCheckoutForm (server assigns guest_user_id).
 * Customer: CheckoutForm with saved addresses.
 * Other logged-in roles: guest form (login must not block checkout).
 */
import { getSession } from "@/lib/auth";
import { ensureGuestUserId } from "@/lib/guest/server";
import { createServerClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./CheckoutForm";
import { GuestCheckoutForm } from "./GuestCheckoutForm";
import Link from "next/link";
import type { Database } from "@/types/database";

export const metadata = {
  title: "Sipariş Ver — SestaKıbrıs",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AddressRow = Database["public"]["Tables"]["customer_addresses"]["Row"];

async function hasCustomerProfile(userId: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

async function getCustomerAddresses(userId: string): Promise<
  Pick<
    AddressRow,
    "id" | "label" | "full_address" | "district" | "is_default"
  >[]
> {
  const supabase = await createServerClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const customerId = (customer as { id: string } | null)?.id;
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
  await ensureGuestUserId();

  const session = await getSession();

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

  const isCustomer =
    session.role === "customer" || (await hasCustomerProfile(session.id));

  if (isCustomer) {
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
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Bu hesap türüyle kayıtlı adres yok — misafir olarak sipariş
          verebilirsiniz.
        </div>
        <GuestCheckoutForm />
      </div>
    </main>
  );
}
