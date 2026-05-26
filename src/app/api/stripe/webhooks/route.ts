/**
 * POST /api/stripe/webhooks
 *
 * Stripe sends payment events here. We verify the signature with STRIPE_WEBHOOK_SECRET
 * so random HTTP clients cannot fake "payment succeeded".
 *
 * Local testing:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhooks
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { getStripeServerEnv } from "@/lib/stripe/env";
import { handleStripeWebhookEvent } from "@/lib/stripe/webhooks";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let webhookSecret: string;
  try {
    webhookSecret = getStripeServerEnv().webhookSecret;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe env error";
    log.error("stripe.webhook.config", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    log.warn("stripe.webhook.signature_failed", { message });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  log.info("stripe.webhook.received", {
    id: event.id,
    type: event.type,
    livemode: event.livemode,
  });

  try {
    await handleStripeWebhookEvent(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    log.error("stripe.webhook.handler_failed", { eventId: event.id, message });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
