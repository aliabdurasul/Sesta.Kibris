/**
 * Stripe Connect Express onboarding via Accounts v2 API.
 *
 * WHY v2: Stripe's newer Connect model uses v2.core.accounts instead of
 * legacy `type: 'express'`. We store the returned account id in Supabase.
 *
 * Money flow (MVP): destination charges — customer pays, platform keeps
 * application_fee_amount, remainder transfers to the connected account automatically.
 */
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { getStripeServerEnv } from "@/lib/stripe/env";

export type ConnectUiStatus = "pending" | "restricted" | "active";

export interface ConnectAccountStatus {
  stripeAccountId: string;
  onboardingComplete: boolean;
  readyToReceivePayments: boolean;
  uiStatus: ConnectUiStatus;
  transfersStatus: string | null;
  requirementsSummary: string | null;
}

/**
 * Create a Connect v2 account for a merchant (recipient + Express dashboard).
 * Uses the exact MVP shape from Stripe Connect v2 docs — NOT legacy accounts.create({ type: 'express' }).
 */
export async function createConnectV2Account(input: {
  displayName: string;
  contactEmail: string;
}): Promise<Stripe.V2.Core.Account> {
  const stripe = getStripe();

  const account = await stripe.v2.core.accounts.create({
    display_name: input.displayName,
    contact_email: input.contactEmail,
    identity: {
      country: "TR",
    },
    dashboard: "express",
    defaults: {
      responsibilities: {
        fees_collector: "application",
        losses_collector: "application",
      },
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: {
              requested: true,
            },
          },
        },
      },
    },
  });

  return account;
}

/** Always fetch live status from Stripe — never trust cached onboarding flags in DB. */
export async function getConnectAccountStatus(
  stripeAccountId: string,
): Promise<ConnectAccountStatus> {
  const stripe = getStripe();

  const account = await stripe.v2.core.accounts.retrieve(stripeAccountId, {
    include: ["requirements", "configuration.recipient"],
  });

  const transfersCapability =
    account.configuration?.recipient?.capabilities?.stripe_balance
      ?.stripe_transfers;

  const transfersStatus = transfersCapability?.status ?? null;
  const readyToReceivePayments = transfersStatus === "active";

  const requirements = account.requirements;
  const entries = requirements?.entries ?? [];
  const hasBlocking = entries.length > 0;

  const onboardingComplete = !hasBlocking && readyToReceivePayments;

  let uiStatus: ConnectUiStatus = "pending";
  if (readyToReceivePayments) {
    uiStatus = "active";
  } else if (hasBlocking || transfersStatus === "restricted") {
    uiStatus = "restricted";
  }

  const requirementsSummary =
    entries.length > 0
      ? `${entries.length} requirement(s) — check Stripe onboarding`
      : null;

  return {
    stripeAccountId: account.id,
    onboardingComplete,
    readyToReceivePayments,
    uiStatus,
    transfersStatus,
    requirementsSummary,
  };
}

/** Stripe-hosted onboarding link (v2 account links). */
export async function createConnectOnboardingLink(
  stripeAccountId: string,
): Promise<string> {
  const stripe = getStripe();
  const { appUrl } = getStripeServerEnv();

  const link = await stripe.v2.core.accountLinks.create({
    account: stripeAccountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        refresh_url: `${appUrl}/connect?refresh=1`,
        return_url: `${appUrl}/connect?return=1`,
      },
    },
  });

  return link.url;
}
