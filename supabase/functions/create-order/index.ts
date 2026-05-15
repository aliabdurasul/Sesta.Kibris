/**
 * Edge Function: POST /functions/v1/create-order
 *
 * Responsibilities:
 * 1. Authenticate the calling user (must be role=customer)
 * 2. Validate request body
 * 3. Re-fetch product prices from DB (never trust client prices)
 * 4. Validate minimum_order_amount
 * 5. Snapshot product data into order_items
 * 6. Create order with status=PENDING
 * 7. Append first status log entry
 * 8. Return { order_id }
 *
 * CRITICAL: Total is ALWAYS calculated server-side from current DB prices.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  notes?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Auth — use service role for writes, user JWT for identity
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Kimlik doğrulama gerekli." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return json({ error: "Geçersiz oturum." }, 401);
    }

    const userRole =
      (user.app_metadata as Record<string, string> | undefined)?.["role"];
    if (userRole !== "customer") {
      return json({ error: "Yalnızca müşteriler sipariş verebilir." }, 403);
    }

    // 2. Parse body
    const body = (await req.json()) as RequestBody;
    const { merchant_id, items, delivery_address, notes } = body;

    if (
      !merchant_id ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !delivery_address?.full_address ||
      !delivery_address?.district
    ) {
      return json({ error: "Eksik veya hatalı sipariş verisi." }, 400);
    }

    // 3. Service role client for all writes
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 4. Fetch customer record
    const { data: customer, error: customerError } = await admin
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (customerError || !customer) {
      return json({ error: "Müşteri kaydı bulunamadı." }, 404);
    }

    // 5. Fetch merchant
    const { data: merchant, error: merchantError } = await admin
      .from("merchants")
      .select("id, minimum_order_amount, is_active")
      .eq("id", merchant_id)
      .single();

    if (merchantError || !merchant || !merchant.is_active) {
      return json({ error: "Restoran bulunamadı veya aktif değil." }, 404);
    }

    // 6. Fetch and validate products — re-fetch from DB, never trust client prices
    const productIds = items.map((i: OrderItem) => i.product_id);
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, description, price, merchant_id, is_available")
      .in("id", productIds)
      .eq("merchant_id", merchant_id);

    if (productsError) {
      return json({ error: "Ürünler yüklenemedi." }, 500);
    }

    // Validate every requested product
    for (const item of items) {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product) {
        return json({ error: `Ürün bulunamadı: ${item.product_id}` }, 400);
      }
      if (!product.is_available) {
        return json({ error: `"${product.name}" şu an mevcut değil.` }, 400);
      }
      if (item.quantity < 1 || item.quantity > 99) {
        return json({ error: "Geçersiz ürün adedi." }, 400);
      }
    }

    // 7. Calculate total server-side
    let totalAmount = 0;
    const orderItems = items.map((item: OrderItem) => {
      const product = products!.find((p) => p.id === item.product_id)!;
      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;
      return {
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: lineTotal,
        // Snapshot product data at time of order
        snapshot: {
          name: product.name,
          description: product.description,
          price: product.price,
        },
      };
    });

    // 8. Check minimum order
    if (
      merchant.minimum_order_amount &&
      totalAmount < merchant.minimum_order_amount
    ) {
      const minDisplay = (merchant.minimum_order_amount / 100).toFixed(0);
      return json(
        {
          error: `Minimum sipariş tutarı ${minDisplay} ₺. Lütfen daha fazla ürün ekleyin.`,
        },
        400,
      );
    }

    // 9. Create order
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_id: customer.id,
        merchant_id,
        status: "PENDING",
        total_amount: totalAmount,
        delivery_address: delivery_address,
        notes: notes ?? null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return json({ error: "Sipariş oluşturulamadı." }, 500);
    }

    // 10. Insert order items (with snapshots)
    const { error: itemsError } = await admin.from("order_items").insert(
      orderItems.map((oi) => ({
        order_id: order.id,
        product_id: oi.product_id,
        quantity: oi.quantity,
        unit_price: oi.unit_price,
        total_price: oi.total_price,
        snapshot: oi.snapshot,
      })),
    );

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      // Rollback order
      await admin.from("orders").delete().eq("id", order.id);
      return json({ error: "Sipariş kalemleri oluşturulamadı." }, 500);
    }

    // 11. Append initial status log (append-only, never updated)
    await admin.from("order_status_log").insert({
      order_id: order.id,
      status: "PENDING",
      actor_role: "customer",
      actor_id: user.id,
      note: "Sipariş oluşturuldu",
    });

    return json({ order_id: order.id }, 201);
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
