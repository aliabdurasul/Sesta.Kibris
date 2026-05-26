/**
 * Stripe Hosted Checkout — platform account only (MIN-LAUNCH).
 *
 * All card payments land on the platform Stripe balance.
 * Merchants are settled offline by admin (see merchant_settled_at on orders).
 */
import { getStripe } from "@/lib/stripe/client";
import { getStripeServerEnv } from "@/lib/stripe/env";
import { assertPositiveAmount } from "@/lib/stripe/helpers";

export interface CreateCheckoutSessionInput {
  orderId: string;
  merchantId: string;
  lineItems: {
    name: string;
    unitAmountKurus: number;
    quantity: number;
  }[];
  totalAmountKurus: number;
  customerEmail?: string;
}

export async function createHostedCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<{ sessionId: string; url: string }> {
  assertPositiveAmount(input.totalAmountKurus, "totalAmountKurus");

  const stripe = getStripe();
  const { appUrl } = getStripeServerEnv();

  const metadata = {
    order_id: input.orderId,
    merchant_id: input.merchantId,
    platform: "sesta-kibris",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "try",
    customer_email: input.customerEmail,
    line_items: input.lineItems.map((item) => {
      assertPositiveAmount(item.unitAmountKurus, "unitAmountKurus");
      return {
        quantity: item.quantity,
        price_data: {
          currency: "try",
          unit_amount: item.unitAmountKurus,
          product_data: { name: item.name },
        },
      };
    }),
    payment_intent_data: {
      metadata,
    },
    metadata,
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/cancel?order_id=${input.orderId}`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { sessionId: session.id, url: session.url };
}
