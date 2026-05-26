/**
 * Stripe Hosted Checkout — destination charges with application fee.
 *
 * WHY Hosted Checkout for MVP: Stripe hosts PCI-sensitive card UI;
 * we only create a Session server-side and redirect the customer.
 */
import { getStripe } from "@/lib/stripe/client";
import { getStripeServerEnv } from "@/lib/stripe/env";
import {
  applicationFeeAmount,
  assertPositiveAmount,
} from "@/lib/stripe/helpers";

export interface CreateCheckoutSessionInput {
  orderId: string;
  merchantId: string;
  connectedAccountId: string;
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

  const fee = applicationFeeAmount(input.totalAmountKurus);
  const stripe = getStripe();
  const { appUrl } = getStripeServerEnv();

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
      application_fee_amount: fee,
      transfer_data: {
        destination: input.connectedAccountId,
      },
      metadata: {
        order_id: input.orderId,
        merchant_id: input.merchantId,
        platform: "sesta-kibris",
      },
    },
    metadata: {
      order_id: input.orderId,
      merchant_id: input.merchantId,
    },
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/cancel?order_id=${input.orderId}`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { sessionId: session.id, url: session.url };
}
