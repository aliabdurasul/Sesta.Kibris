/**
 * Legacy webhook path — forwards to canonical /api/stripe/webhooks.
 * Keep for older stripe listen commands; prefer /api/stripe/webhooks in docs.
 */
export { POST, GET } from "@/app/api/stripe/webhooks/route";
