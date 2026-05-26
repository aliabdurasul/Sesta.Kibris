/**
 * Stripe webhook event handlers (MVP).
 *
 * WHY separate from route.ts: the route only verifies signatures and parses
 * the raw body; business logic lives here for testing and future GRANITE hooks.
 *
 * Local development:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhooks
 *   stripe trigger payment_intent.succeeded
 *
 * The CLI prints a whsec_... secret — put it in STRIPE_WEBHOOK_SECRET.
 */
import type Stripe from "stripe";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { log } from "@/lib/logger";
import { applicationFeeAmount } from "@/lib/stripe/helpers";

type AdminClient = ReturnType<typeof createStripeAdminClient>;

/** Idempotent ingest: skip if we already processed this Stripe event id. */
export async function ensureWebhookEventRecorded(
  admin: AdminClient,
  event: Stripe.Event,
): Promise<boolean> {
  const { data: existing } = await admin
    .from("stripe_webhook_events")
    .select("id, processed_at")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing?.processed_at) {
    log.info("stripe.webhook.duplicate", { eventId: event.id, type: event.type });
    return false;
  }

  if (!existing) {
    const { error } = await admin.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
    if (error) {
      log.error("stripe.webhook.insert_failed", { eventId: event.id, reason: error.message });
      throw error;
    }
  }

  return true;
}

async function markWebhookProcessed(
  admin: AdminClient,
  eventId: string,
  error?: string,
): Promise<void> {
  await admin
    .from("stripe_webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      last_error: error ?? null,
    })
    .eq("stripe_event_id", eventId);
}

async function markOrderPaid(
  admin: AdminClient,
  orderId: string,
  paymentIntentId: string | null,
  sessionId: string | null,
): Promise<void> {
  const { data: order } = await admin
    .from("orders")
    .select("id, total_amount, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    log.warn("stripe.webhook.order_not_found", { orderId });
    return;
  }

  if (order.payment_status === "paid") {
    log.info("stripe.webhook.order_already_paid", { orderId });
    return;
  }

  const commission = applicationFeeAmount(order.total_amount as number);

  await admin
    .from("orders")
    .update({
      payment_status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      stripe_session_id: sessionId,
      commission_amount: commission,
    })
    .eq("id", orderId)
    .eq("payment_status", "requires_payment");
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const admin = createStripeAdminClient();
  const shouldProcess = await ensureWebhookEventRecorded(admin, event);
  if (!shouldProcess) return;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (!orderId) {
          log.warn("stripe.webhook.missing_order_id", { sessionId: session.id });
          break;
        }
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
        await markOrderPaid(admin, orderId, pi, session.id);
        log.info("stripe.webhook.checkout_completed", { orderId, sessionId: session.id });
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await markOrderPaid(admin, orderId, pi.id, null);
        }
        log.info("stripe.webhook.payment_intent_succeeded", {
          paymentIntentId: pi.id,
          orderId: orderId ?? null,
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await admin
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", orderId)
            .eq("payment_status", "requires_payment");
        }
        log.warn("stripe.webhook.payment_intent_failed", {
          paymentIntentId: pi.id,
          orderId: orderId ?? null,
        });
        break;
      }

      case "account.updated": {
        log.info("stripe.webhook.account_updated", {
          accountId: (event.data.object as Stripe.Account).id,
        });
        break;
      }

      default:
        log.info("stripe.webhook.unhandled", { type: event.type });
    }

    await markWebhookProcessed(admin, event.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markWebhookProcessed(admin, event.id, message);
    throw err;
  }
}
