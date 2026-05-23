/**
 * Edge Function: POST /functions/v1/create-order
 *
 * Supports:
 *   - Authenticated customer (JWT role=customer)
 *   - Guest checkout (no JWT; guest_name + guest_phone required)
 *
 * Schema aligned with migrations 00006, 00007, 00008.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  /** Set by /api/orders/create for logged-in customers */
  authenticated_user_id?: string | null;
  guest_user_id?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
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

    let userId: string | null = null;
    let isGuest = true;

    // Trusted server proxy (/api/orders/create) — do not require end-user JWT
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
      // Direct client call (legacy): optional Bearer customer JWT
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
      // No JWT: guest if guest_user_id + guest fields present
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
      return json({ error: "Eksik veya hatalı sipariş verisi." }, 400);
    }

    let customerId: string | null = null;
    let guestUserId: string | null = null;
    let guestName: string | null = null;
    let guestPhone: string | null = null;

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (isGuest) {
      guestUserId = body.guest_user_id?.trim() ?? null;
      guestName = body.guest_name?.trim() ?? null;
      guestPhone = body.guest_phone?.trim() ?? null;
      if (!guestUserId || !uuidRe.test(guestUserId)) {
        return json({ error: "Geçersiz misafir oturumu. Sayfayı yenileyin." }, 400);
      }
      if (!guestName || !guestPhone) {
        return json(
          { error: "Misafir sipariş için ad ve telefon zorunludur." },
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
          console.error("Customer auto-create error:", insertError);
          return json({ error: "Müşteri kaydı oluşturulamadı." }, 500);
        }
        customer = created;
      }

      if (customerError || !customer) {
        return json({ error: "Müşteri kaydı bulunamadı." }, 404);
      }
      customerId = customer.id;
    } else {
      return json(
        {
          error: "Kimlik doğrulama gerekli veya misafir bilgisi girin.",
          code: "AUTH_REQUIRED",
          hint: "Use POST /api/orders/create from the storefront or send X-Checkout-Auth-Mode guest with guest_user_id.",
        },
        401,
      );
    }

    const { data: merchant, error: merchantError } = await admin
      .from("merchants")
      .select("id, minimum_order_amount, is_active, is_open")
      .eq("id", merchant_id)
      .maybeSingle();

    if (merchantError || !merchant || !merchant.is_active) {
      return json({ error: "Market bulunamadı veya aktif değil." }, 404);
    }

    if (!merchant.is_open) {
      return json({ error: "Bu market şu an siparişe kapalı." }, 400);
    }

    const productIds = items.map((i: OrderItem) => i.product_id);
    const { data: products, error: productsError } = await admin
      .from("products")
      .select(
        "id, product_id, name, description, price, merchant_id, is_available",
      )
      .in("product_id", productIds)
      .eq("merchant_id", merchant_id);

    if (productsError) {
      console.error("Product lookup error:", productsError);
      return json(
        {
          error: "Ürün envanteri yüklenemedi.",
          code: "INVENTORY_LOOKUP_FAILED",
          detail: productsError.message,
        },
        500,
      );
    }

    if (!products?.length) {
      return json(
        {
          error:
            "Sepetteki ürünler bu markette bulunamadı. Sayfayı yenileyip tekrar deneyin.",
          code: "INVENTORY_NOT_FOUND",
          requested_product_ids: productIds,
        },
        400,
      );
    }

    const missingIds = productIds.filter(
      (pid) => !products.some((p) => p.product_id === pid),
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
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product) {
        return json(
          {
            error: `Ürün bulunamadı: ${item.product_id}`,
            code: "PRODUCT_NOT_FOUND",
          },
          400,
        );
      }
      if (!product.is_available) {
        return json({ error: `"${product.name}" şu an mevcut değil.` }, 400);
      }
      if (!product.price || product.price <= 0) {
        return json(
          {
            error: `"${product.name}" için geçerli fiyat yok.`,
            code: "INVALID_PRICE",
          },
          400,
        );
      }
      if (item.quantity < 1 || item.quantity > 99) {
        return json({ error: "Geçersiz ürün adedi." }, 400);
      }
    }

    let totalAmount = 0;
    const orderItems = items.map((item: OrderItem) => {
      const product = products.find((p) => p.product_id === item.product_id)!;
      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;
      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });

    const minOrder = merchant.minimum_order_amount as number | null;
    if (minOrder && totalAmount < minOrder) {
      return json(
        {
          error: `Minimum sipariş tutarı ${(minOrder / 100).toFixed(0)} ₺. Lütfen daha fazla ürün ekleyin.`,
        },
        400,
      );
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_id: customerId,
        merchant_id,
        status: "PENDING",
        total_amount: totalAmount,
        delivery_address: delivery_address,
        customer_notes: customerNotes,
        guest_user_id: guestUserId,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: body.guest_email?.trim() || null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return json({ error: "Sipariş oluşturulamadı." }, 500);
    }

    const { error: itemsError } = await admin.from("order_items").insert(
      orderItems.map((oi) => ({
        order_id: order.id,
        product_id: oi.product_id,
        product_name: oi.product_name,
        unit_price: oi.unit_price,
        quantity: oi.quantity,
        line_total: oi.line_total,
      })),
    );

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      await admin.from("orders").delete().eq("id", order.id);
      return json({ error: "Sipariş kalemleri oluşturulamadı." }, 500);
    }

    await admin.from("order_status_log").insert({
      order_id: order.id,
      from_status: null,
      to_status: "PENDING",
      actor_role: isGuest ? "guest" : "customer",
      actor_id: isGuest ? null : userId,
      note: isGuest ? "Misafir sipariş oluşturuldu" : "Sipariş oluşturuldu",
    });

    return json({ order_id: order.id, guest: isGuest }, 201);
  } catch (err) {
    console.error("create-order unhandled error:", err);
    return json({ error: "Beklenmedik bir hata oluştu." }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
