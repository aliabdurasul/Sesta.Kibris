/**
 * Server-only Stripe SDK singleton.
 *
 * WHY: Creating a new Stripe() instance per request wastes memory and
 * can hit connection limits. One shared client per Node process is standard.
 *
 * NEVER import this file in Client Components — secret keys must stay on the server.
 */
import Stripe from "stripe";
import { getStripeServerEnv } from "@/lib/stripe/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const { secretKey } = getStripeServerEnv();
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}
