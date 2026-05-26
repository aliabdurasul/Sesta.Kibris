/**
 * Shared checkout submission for COD vs card on /checkout.
 */
import { resolveOrderIdFromCreateResponse } from "@/lib/orders/resolve-order-id";
import {
  getOrCreateGuestToken,
  rememberGuestOrder,
  saveGuestToken,
} from "@/lib/guest/token-client";
import type { PaymentMethodChoice } from "@/components/checkout/PaymentMethodSelector";

export interface SubmitCheckoutInput {
  paymentMethod: PaymentMethodChoice;
  body: Record<string, unknown>;
  guestToken?: string;
}

export type SubmitCheckoutResult =
  | { kind: "cod"; orderId: string; guestToken?: string }
  | { kind: "card"; url: string; orderId: string };

export async function submitCheckout(
  input: SubmitCheckoutInput,
): Promise<SubmitCheckoutResult> {
  if (input.paymentMethod === "card") {
    const res = await fetch("/api/stripe/checkout/create-from-cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(input.body),
    });

    const json = (await res.json()) as {
      url?: string;
      order_id?: string;
      guest_token?: string;
      error?: string;
    };

    if (!res.ok || !json.url || !json.order_id) {
      throw new Error(json.error ?? "Ödeme başlatılamadı.");
    }

    const token = input.guestToken ?? json.guest_token;
    if (token) {
      saveGuestToken(token, json.order_id);
      rememberGuestOrder(json.order_id);
    }

    return { kind: "card", url: json.url, orderId: json.order_id };
  }

  const res = await fetch("/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(input.body),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(
      (typeof json["error"] === "string" ? json["error"] : null) ??
        "Sipariş oluşturulamadı.",
    );
  }

  const orderId = resolveOrderIdFromCreateResponse(json);
  if (!orderId) {
    throw new Error("Sipariş oluşturuldu ancak sipariş numarası alınamadı.");
  }

  const guestToken =
    typeof json["guest_token"] === "string" ? json["guest_token"] : input.guestToken;

  return { kind: "cod", orderId, guestToken: guestToken ?? undefined };
}
