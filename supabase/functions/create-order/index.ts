/**
 * Edge Function: POST /functions/v1/create-order
 *
 * Supports authenticated customer and guest checkout.
 * Uses merchant_inventory + global_products (not legacy products view FK).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-checkout-auth-mode",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OrderItem {
  product_id: string;
  quantity: number;
}

interface DeliveryAddress {
  full_address: string;
  district: string;
}

interface RequestBody {
  merchant_id: string;
  items: OrderItem[];
  delivery_address: DeliveryAddress;
  customer_notes?: string | null;
  notes?: string | null;
  authenticated_user_id?: string | null;
  guest_user_id?: string | null;
  guest_token?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
  /** "card" = online payment pending; omit or "cod" = cash on delivery */
  payment_method?: "cod" | "card" | null;
}

/** MVP platform fee — mirrors src/lib/stripe/helpers.ts (10%). */
function applicationFeeAmountKurus(totalKurus: number): number {
  return Math.round((totalKurus * 1000) / 10_000);
}

interface InventoryRow {
  id: string;
  product_id: string;
  price: number;
  is_available: boolean;
  global_products: {
    id: string;
    name: string;
    is_active: boolean;
  } | null;
}

function logEvent(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

function dbErrorFields(err: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}) {
  return {
    db_code: err.code ?? null,
    db_message: err.message ?? null,
    db_details: err.details ?? null,
    db_hint: err.hint ?? null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = (await req.json()) as RequestBody;
    const checkoutMode = req.headers.get("X-Checkout-Auth-Mode");

    logEvent("order.create.start", {
      checkoutMode,
      merchantId: body.merchant_id ?? null,
      itemCount: Array.isArray(body.items) ? body.items.length : 0,
    });

    let userId: string | null = null;
    let isGuest = true;

    if (checkoutMode === "authenticated") {
      const authUserId = body.authenticated_user_id?.trim() ?? null;
      if (!authUserId) {
        return json(
          {
            error: "Kimlik doğrulama başarısız.",
            code: "MISSING_AUTHENTICATED_USER_ID",
          },
          401,
        );
      }
      userId = authUserId;
      isGuest = false;
    } else if (checkoutMode === "guest") {
      isGuest = true;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const {
          data: { user },
          error: authError,
        } = await userClient.auth.getUser();

        if (!authError && user) {
          const userRole = (
            user.app_metadata as Record<string, string> | undefined
          )?.["role"];
          if (userRole === "customer") {
            userId = user.id;
            isGuest = false;
          } else if (userRole) {
            return json(
              {
                error:
                  "Yalnızca müşteriler veya misafirler sipariş verebilir.",
                code: "ROLE_NOT_ALLOWED",
              },
              403,
            );
          }
        }
      }
      if (
        !userId &&
        body.guest_user_id &&
        body.guest_name &&
        body.guest_phone
      ) {
        isGuest = true;
      }
    }

    const { merchant_id, items, delivery_address } = body;
    const customerNotes = body.customer_notes ?? body.notes ?? null;

    if (
      !merchant_id ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !delivery_address?.full_address ||
      !delivery_address?.district
    ) {
      return json(
        { error: "Eksik veya hatalı sipariş verisi.", code: "INVALID_PAYLOAD" },
        400,
      );
    }

    let customerId: string | null = null;
    let guestUserId: string | null = null;
    let guestToken: string | null = null;
    let guestName: string | null = null;
    let guestPhone: string | null = null;

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const guestTokenRe =
      /^sk_guest_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    function normalizeGuestToken(value: string): string {
      const v = value.trim();
      if (v.startsWith("sk_guest_")) return v.slice("sk_guest_".length);
      return v;
    }

    function isValidGuestToken(value: string | null | undefined): boolean {
      if (!value?.trim()) return false;
      const v = value.trim();
      return uuidRe.test(v) || guestTokenRe.test(v);
    }

    if (isGuest) {
      guestUserId = body.guest_user_id?.trim() ?? null;
      const rawGuestToken = body.guest_token?.trim() ?? null;
      guestName = body.guest_name?.trim() ?? null;
      guestPhone = body.guest_phone?.trim() ?? null;
      if (!isValidGuestToken(rawGuestToken)) {
        return json(
          { error: "Geçersiz misafir anahtarı. Sayfayı yenileyin.", code: "INVALID_GUEST_TOKEN" },
          400,
        );
      }
      guestToken = normalizeGuestToken(rawGuestToken!);
      if (!guestUserId || !uuidRe.test(guestUserId)) {
        return json(
          { error: "Geçersiz misafir oturumu. Sayfayı yenileyin.", code: "INVALID_GUEST_SESSION" },
          400,
        );
      }
      if (!guestName || !guestPhone) {
        return json(
          {
            error: "Misafir sipariş için ad ve telefon zorunludur.",
            code: "GUEST_FIELDS_REQUIRED",
          },
          400,
        );
      }
      guestPhone = guestPhone.replace(/[^\d+]/g, "").slice(0, 20);
      if (guestPhone.length < 8) {
        return json(
          { error: "Geçerli bir telefon numarası girin.", code: "INVALID_PHONE" },
          400,
        );
      }
    } else if (userId) {
      let { data: customer, error: customerError } = await admin
        .from("customers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!customer && !customerError) {
        const { data: created, error: insertError } = await admin
          .from("customers")
          .insert({
            id: userId,
            user_id: userId,
            full_name: guestName ?? "Müşteri",
            phone: guestPhone ?? "0000000000",
          })
          .select("id")
          .single();
        if (insertError || !created) {
          logEvent("order.create.customer_insert_failed", dbErrorFields(insertError ?? {}));
          return json(
            {
              error: "Müşteri kaydı oluşturulamadı.",
              code: "CUSTOMER_INSERT_FAILED",
              ...dbErrorFields(insertError ?? {}),
            },
            500,
          );
        }
        customer = created;
      }

      if (customerError || !customer) {
        return json(
          { error: "Müşteri kaydı bulunamadı.", code: "CUSTOMER_NOT_FOUND" },
          404,
        );
      }
      customerId = customer.id;
    } else {
      return json(
        {
          error: "Kimlik doğrulama gerekli veya misafir bilgisi girin.",
          code: "AUTH_REQUIRED",
        },
        401,
      );
    }

    const paymentMethod =
      body.payment_method === "card" ? "card" : null;

    const { data: merchant, error: merchantError } = await admin
      .from("merchants")
      .select("id, minimum_order_amount, is_active, is_open, accepts_online_payment")
      .eq("id", merchant_id)
      .maybeSingle();

    if (merchantError || !merchant || !merchant.is_active) {
      logEvent("order.create.merchant_lookup_failed", {
        merchantId: merchant_id,
        ...dbErrorFields(merchantError ?? {}),
      });
      return json(
        { error: "Market bulunamadı veya aktif değil.", code: "MERCHANT_NOT_FOUND" },
        404,
      );
    }

    if (!merchant.is_open) {
      return json(
        { error: "Bu market şu an siparişe kapalı.", code: "MERCHANT_CLOSED" },
        400,
      );
    }

    const globalProductIds = items.map((i: OrderItem) => i.product_id);

    logEvent("order.create.inventory_lookup", {
      merchantId: merchant_id,
      globalProductIds,
      itemCount: items.length,
    });

    const { data: inventoryRows, error: inventoryError } = await admin
      .from("merchant_inventory")
      .select(
        `
        id,
        product_id,
        price,
        is_available,
        global_products!inner ( id, name, is_active )
      `,
      )
      .eq("merchant_id", merchant_id)
      .in("product_id", globalProductIds);

    if (inventoryError) {
      logEvent("order.create.inventory_lookup_failed", {
        merchantId: merchant_id,
        globalProductIds,
        ...dbErrorFields(inventoryError),
      });
      return json(
        {
          error: "Ürün envanteri yüklenemedi.",
          code: "INVENTORY_LOOKUP_FAILED",
          ...dbErrorFields(inventoryError),
        },
        500,
      );
    }

    const inventory = (inventoryRows ?? []) as InventoryRow[];

    if (!inventory.length) {
      return json(
        {
          error:
            "Sepetteki ürünler bu markette bulunamadı. Sayfayı yenileyip tekrar deneyin.",
          code: "INVENTORY_NOT_FOUND",
          requested_product_ids: globalProductIds,
        },
        400,
      );
    }

    const missingIds = globalProductIds.filter(
      (pid) => !inventory.some((row) => row.product_id === pid),
    );
    if (missingIds.length > 0) {
      return json(
        {
          error: `Market envanterinde bulunmayan ürün(ler): ${missingIds.join(", ")}`,
          code: "PRODUCT_NOT_IN_INVENTORY",
          missing_product_ids: missingIds,
        },
        400,
      );
    }

    for (const item of items) {
      const row = inventory.find((r) => r.product_id === item.product_id);
      if (!row) {
        return json(
          {
            error: `Ürün bulunamadı: ${item.product_id}`,
            code: "PRODUCT_NOT_FOUND",
          },
          400,
        );
      }
      const gp = row.global_products;
      if (!gp?.is_active) {
        return json(
          {
            error: `"${gp?.name ?? "Ürün"}" artık listede değil.`,
            code: "PRODUCT_INACTIVE",
          },
          400,
        );
      }
      if (!row.is_available) {
        return json(
          {
            error: `"${gp.name}" şu an mevcut değil.`,
            code: "PRODUCT_UNAVAILABLE",
          },
          400,
        );
      }
      if (!row.price || row.price <= 0 || !Number.isFinite(row.price)) {
        return json(
          {
            error: `"${gp.name}" için geçerli fiyat yok.`,
            code: "INVALID_PRICE",
          },
          400,
        );
      }
      if (item.quantity < 1 || item.quantity > 99) {
        return json(
          { error: "Geçersiz ürün adedi.", code: "INVALID_QUANTITY" },
          400,
        );
      }
    }

    let totalAmount = 0;
    const orderItems = items.map((item: OrderItem) => {
      const row = inventory.find((r) => r.product_id === item.product_id)!;
      const gp = row.global_products!;
      const lineTotal = row.price * item.quantity;
      totalAmount += lineTotal;
      return {
        product_id: row.id,
        global_product_id: row.product_id,
        product_name: gp.name,
        unit_price: row.price,
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });

    const minOrder = merchant.minimum_order_amount as number | null;
    if (minOrder && totalAmount < minOrder) {
      return json(
        {
          error: `Minimum sipariş tutarı ${(minOrder / 100).toFixed(0)} ₺. Lütfen daha fazla ürün ekleyin.`,
          code: "BELOW_MINIMUM_ORDER",
        },
        400,
      );
    }

    if (paymentMethod === "card") {
      if (!merchant.accepts_online_payment) {
        return json(
          {
            error: "Bu market kartla ödemeyi kabul etmiyor.",
            code: "CARD_PAYMENTS_DISABLED",
          },
          400,
        );
      }

      const { data: connectRow } = await admin
        .from("merchant_stripe_accounts")
        .select("stripe_account_id")
        .eq("merchant_id", merchant_id)
        .maybeSingle();

      if (!connectRow?.stripe_account_id) {
        return json(
          {
            error: "Market Stripe hesabı bağlı değil.",
            code: "STRIPE_NOT_CONNECTED",
          },
          400,
        );
      }
    }

    const commissionAmount =
      paymentMethod === "card" ? applicationFeeAmountKurus(totalAmount) : null;

    logEvent("order.create.order_insert", {
      merchantId: merchant_id,
      customerId,
      guestUserId,
      totalAmount,
      itemCount: orderItems.length,
      inventoryIds: orderItems.map((oi) => oi.product_id),
    });

    const orderInsert: Record<string, unknown> = {
      customer_id: customerId,
      merchant_id,
      status: "PENDING",
      total_amount: totalAmount,
      delivery_address: delivery_address,
      customer_notes: customerNotes,
      guest_user_id: guestUserId,
      guest_token: guestToken,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_email: body.guest_email?.trim() || null,
    };

    if (paymentMethod === "card") {
      orderInsert.payment_method = "card";
      orderInsert.payment_status = "requires_payment";
      orderInsert.commission_amount = commissionAmount;
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert(orderInsert)
      .select("id")
      .single();

    if (orderError || !order) {
      logEvent("order.create.order_insert_failed", {
        merchantId: merchant_id,
        ...dbErrorFields(orderError ?? {}),
      });
      return json(
        {
          error: "Sipariş oluşturulamadı.",
          code: "ORDER_INSERT_FAILED",
          ...dbErrorFields(orderError ?? {}),
        },
        500,
      );
    }

    const itemsPayload = orderItems.map((oi) => ({
      order_id: order.id,
      product_id: oi.product_id,
      product_name: oi.product_name,
      unit_price: oi.unit_price,
      quantity: oi.quantity,
      line_total: oi.line_total,
    }));

    logEvent("order.create.items_insert", {
      orderId: order.id,
      payload: itemsPayload,
    });

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      logEvent("order.create.items_insert_failed", {
        orderId: order.id,
        merchantId: merchant_id,
        payload: itemsPayload,
        ...dbErrorFields(itemsError),
      });

      const { error: rollbackError } = await admin
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (rollbackError) {
        logEvent("order.create.rollback_failed", {
          orderId: order.id,
          ...dbErrorFields(rollbackError),
        });
      } else {
        logEvent("order.create.rollback", { orderId: order.id });
      }

      return json(
        {
          error: "Sipariş kalemleri oluşturulamadı.",
          code: "ORDER_ITEMS_INSERT_FAILED",
          order_id: order.id,
          ...dbErrorFields(itemsError),
        },
        500,
      );
    }

    await admin.from("order_status_log").insert({
      order_id: order.id,
      from_status: null,
      to_status: "PENDING",
      actor_role: isGuest ? "guest" : "customer",
      actor_id: isGuest ? null : userId,
      note: isGuest ? "Misafir sipariş oluşturuldu" : "Sipariş oluşturuldu",
    });

    logEvent("order.create.success", {
      orderId: order.id,
      merchantId: merchant_id,
      guestUserId,
      userId,
      itemCount: orderItems.length,
      totalAmount,
    });

    return json(
      { order_id: order.id, guest: isGuest, guest_token: isGuest ? guestToken : undefined },
      201,
    );
  } catch (err) {
    logEvent("order.create.unhandled", {
      reason: err instanceof Error ? err.message : String(err),
    });
    return json(
      { error: "Beklenmedik bir hata oluştu.", code: "UNHANDLED" },
      500,
    );
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
