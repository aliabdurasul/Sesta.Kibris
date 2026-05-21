/**
 * Edge Function: POST /functions/v1/transition-order
 *
 * Enforces the Order State Machine.
 * ASSIGNED: admin only (+ courier_id, assigned_at)
 * PICKED_UP: courier only (ASSIGNED → PICKED_UP)
 * IN_TRANSIT: courier only (PICKED_UP → IN_TRANSIT, sets picked_up_at)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "REJECTED"
  | "FAILED_DELIVERY"
  | "CANCELLED";

type ActorRole = "customer" | "merchant" | "courier" | "admin";

type DeliveryMode = "MERCHANT_DELIVERY" | "PLATFORM_COURIER" | "HYBRID";

const VALID_TRANSITIONS: Record<
  string,
  { to: OrderStatus; allowedRoles: ActorRole[] }[]
> = {
  PENDING: [
    { to: "CONFIRMED", allowedRoles: ["merchant", "admin"] },
    { to: "REJECTED", allowedRoles: ["merchant", "admin"] },
    { to: "CANCELLED", allowedRoles: ["customer", "admin"] },
  ],
  CONFIRMED: [
    { to: "READY", allowedRoles: ["merchant", "admin"] },
    { to: "CANCELLED", allowedRoles: ["admin"] },
  ],
  READY: [{ to: "ASSIGNED", allowedRoles: ["admin"] }],
  ASSIGNED: [
    { to: "PICKED_UP", allowedRoles: ["courier"] },
    { to: "IN_TRANSIT", allowedRoles: ["admin"] },
  ],
  PICKED_UP: [
    { to: "IN_TRANSIT", allowedRoles: ["courier", "admin"] },
  ],
  IN_TRANSIT: [
    { to: "DELIVERED", allowedRoles: ["courier", "admin"] },
    { to: "FAILED_DELIVERY", allowedRoles: ["courier", "admin"] },
  ],
};

interface RequestBody {
  order_id: string;
  new_status: OrderStatus;
  courier_id?: string | null;
  note?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Kimlik doğrulama gerekli." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) return json({ error: "Geçersiz oturum." }, 401);

    const meta = user.app_metadata as Record<string, string> | undefined;
    let actorRole = meta?.["role"] as ActorRole | undefined;

    const body = (await req.json()) as RequestBody;
    const { order_id, new_status, courier_id, note } = body;

    if (!order_id || !new_status) {
      return json({ error: "order_id ve new_status zorunludur." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const courierOnlyStatuses: OrderStatus[] = [
      "PICKED_UP",
      "IN_TRANSIT",
      "DELIVERED",
      "FAILED_DELIVERY",
    ];
    if (
      courierOnlyStatuses.includes(new_status) &&
      actorRole !== "courier" &&
      actorRole !== "admin"
    ) {
      const { data: courierRole } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "courier")
        .maybeSingle();
      if (courierRole) actorRole = "courier";
    }

    if (!actorRole) return json({ error: "Hesap rolü tanımsız." }, 403);

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, status, merchant_id, customer_id, courier_id, picked_up_at")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return json({ error: "Sipariş bulunamadı." }, 404);
    }

    const currentStatus = order.status as OrderStatus;

    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions) {
      return json(
        { error: `${currentStatus} durumundan geçiş yapılamaz.` },
        400,
      );
    }

    const transition = allowedTransitions.find((t) => t.to === new_status);
    if (!transition) {
      return json(
        { error: `${currentStatus} → ${new_status} geçişi geçersiz.` },
        400,
      );
    }

    if (!transition.allowedRoles.includes(actorRole)) {
      const code =
        new_status === "ASSIGNED"
          ? "ASSIGNMENT_FORBIDDEN"
          : new_status === "PICKED_UP"
            ? "PICKUP_FORBIDDEN"
            : "TRANSITION_FORBIDDEN";
      return json(
        { error: `${actorRole} bu geçişi gerçekleştiremez.`, code },
        403,
      );
    }

    if (actorRole === "merchant") {
      const merchantId = meta?.["merchant_id"];
      if (merchantId !== order.merchant_id) {
        return json({ error: "Bu sipariş size ait değil." }, 403);
      }
    }

    if (actorRole === "courier") {
      let courierId = meta?.["courier_id"];
      if (!courierId) {
        const { data: row } = await admin
          .from("couriers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        courierId = row?.id;
      }
      if (!order.courier_id || order.courier_id !== courierId) {
        return json(
          { error: "Bu sipariş size atanmamış.", code: "NOT_ASSIGNED_COURIER" },
          403,
        );
      }
    }

    if (new_status === "ASSIGNED") {
      if (actorRole !== "admin") {
        return json(
          {
            error: "Kurye ataması yalnızca yönetici tarafından yapılabilir.",
            code: "ASSIGNMENT_FORBIDDEN",
          },
          403,
        );
      }
      if (!courier_id) {
        return json({ error: "Kurye ataması için courier_id zorunludur." }, 400);
      }

      const { data: merchant } = await admin
        .from("merchants")
        .select("delivery_mode")
        .eq("id", order.merchant_id)
        .single();

      const mode = (merchant?.delivery_mode ?? "PLATFORM_COURIER") as DeliveryMode;
      if (mode === "MERCHANT_DELIVERY") {
        return json(
          {
            error: "Bu işletme kendi kuryesini kullanıyor; platform ataması yapılamaz.",
            code: "DELIVERY_MODE_MERCHANT_ONLY",
          },
          403,
        );
      }

      const { data: courierRow } = await admin
        .from("couriers")
        .select("id, is_active, merchant_id")
        .eq("id", courier_id)
        .maybeSingle();

      if (!courierRow?.is_active) {
        return json({ error: "Kurye bulunamadı veya aktif değil." }, 400);
      }

      if (mode === "PLATFORM_COURIER" && courierRow.merchant_id != null) {
        return json(
          {
            error: "Platform kuryesi gerekli; işletme kuryesi atanamaz.",
            code: "DELIVERY_MODE_PLATFORM_ONLY",
          },
          403,
        );
      }
    }

    const now = new Date().toISOString();
    const orderUpdate: Record<string, unknown> = { status: new_status };

    if (new_status === "ASSIGNED" && courier_id) {
      orderUpdate.courier_id = courier_id;
      orderUpdate.assigned_at = now;
    }
    if (new_status === "PICKED_UP") {
      orderUpdate.picked_up_at = now;
    }
    if (new_status === "IN_TRANSIT") {
      orderUpdate.picked_up_at = order.picked_up_at ?? now;
    }

    const { error: updateError } = await admin
      .from("orders")
      .update(orderUpdate)
      .eq("id", order_id);

    if (updateError) {
      console.error("Order update error:", updateError);
      return json({ error: "Durum güncellenemedi." }, 500);
    }

    await admin.from("order_status_log").insert({
      order_id,
      from_status: currentStatus,
      to_status: new_status,
      actor_role: actorRole,
      actor_id: user.id,
      note: note ?? null,
    });

    return json({ success: true, order_id, new_status });
  } catch (err) {
    console.error("transition-order unhandled error:", err);
    return json({ error: "Beklenmedik bir hata oluştu." }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
