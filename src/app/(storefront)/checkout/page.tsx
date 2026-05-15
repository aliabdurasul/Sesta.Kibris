/**
 * Checkout page — /checkout
 *
 * Guest flow: shows a login/register prompt with cart summary.
 * Cart is in sessionStorage (client-side Zustand) — it survives the redirect.
 *
 * Authenticated customer flow: shows order form with saved addresses.
 * Authenticated non-customer: redirected to their dashboard.
 *
 * The actual order creation calls /functions/v1/create-order Edge Function.
 */
import { getSession } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./CheckoutForm";
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
    .single();

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

  // ── Guest → show auth gate (don't hard redirect — keeps UX smooth) ────────
  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center">
            <div className="mb-3 text-3xl">🛒</div>
            <h1 className="text-xl font-bold text-gray-900">
              Siparişi tamamlamak için giriş yapın
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Sepetiniz kayıtlı. Giriş yaptıktan sonra siparişinize devam
              edebilirsiniz.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/auth/login?redirectTo=/checkout"
                className="block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/register?redirectTo=/checkout"
                className="block w-full rounded-xl bg-gray-100 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Hesap Oluştur
              </Link>
              <Link
                href="/merchants"
                className="block text-sm text-gray-400 hover:text-gray-600"
              >
                Alışverişe devam et →
              </Link>
            </div>
          </div>
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
