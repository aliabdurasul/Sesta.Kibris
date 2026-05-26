/**
 * POST /api/stripe/products/create
 * Creates a Stripe Product + Price and stores mapping in stripe_products.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { getStripe } from "@/lib/stripe/client";
import { assertPositiveAmount } from "@/lib/stripe/helpers";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  unit_amount: z.number().int().positive(),
  inventory_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole("merchant");
    if (!session.merchantId) {
      return NextResponse.json({ error: "Merchant profile not found" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, description, unit_amount, inventory_id } = parsed.data;
    assertPositiveAmount(unit_amount, "unit_amount");

    const admin = createStripeAdminClient();
    const { data: connectRow } = await admin
      .from("merchant_stripe_accounts")
      .select("stripe_account_id")
      .eq("merchant_id", session.merchantId)
      .maybeSingle();

    if (!connectRow?.stripe_account_id) {
      return NextResponse.json(
        { error: "Complete Stripe Connect onboarding first" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const product = await stripe.products.create({
      name,
      description: description ?? undefined,
      default_price_data: {
        unit_amount,
        currency: "try",
      },
      metadata: {
        merchant_id: session.merchantId,
        platform: "sesta-kibris",
      },
    });

    const priceId =
      typeof product.default_price === "string"
        ? product.default_price
        : product.default_price?.id;

    if (!priceId) {
      return NextResponse.json({ error: "Stripe product missing default price" }, { status: 500 });
    }

    const { data: row, error } = await admin
      .from("stripe_products")
      .insert({
        merchant_id: session.merchantId,
        stripe_product_id: product.id,
        stripe_price_id: priceId,
        name,
        description: description ?? null,
        unit_amount,
        currency: "try",
        inventory_id: inventory_id ?? null,
      })
      .select("id, stripe_product_id, stripe_price_id, name, unit_amount")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Product create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
