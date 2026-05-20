/**
 * Edge Function: POST /functions/v1/transition-order
 *
 * Enforces the Order State Machine from SYSTEM_DESIGN.md.
 * Validates:
 * - Actor role has permission for this transition
 * - Transition is valid from current state
 * Appends to order_status_log (append-only).
 *
 * Valid transitions:
 * PENDING   → CONFIRMED | REJECTED    (merchant)
 * CONFIRMED → READY                   (merchant)
 * READY     → ASSIGNED                (system/courier assignment)
 * ASSIGNED  → IN_TRANSIT              (courier)
 * IN_TRANSIT→ DELIVERED | FAILED_DELIVERY (courier)
 * ANY       → CANCELLED               (customer when PENDING only)
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
  | "IN_TRANSIT"
  | "DELIVERED"
  | "REJECTED"
  | "FAILED_DELIVERY"
  | "CANCELLED";

type ActorRole = "customer" | "merchant" | "courier" | "admin";

// [from, to] → allowed actor roles
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
  READY: [
    { to: "ASSIGNED", allowedRoles: ["admin"] },
  ],
  ASSIGNED: [
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

    // Verify actor JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) return json({ error: "Geçersiz oturum." }, 401);

    const actorRole = (
      user.app_metadata as Record<string, string> | undefined
    )?.["role"] as ActorRole | undefined;

    if (!actorRole) return json({ error: "Hesap rolü tanımsız." }, 403);

    // Parse body
    const body = (await req.json()) as RequestBody;
    const { order_id, new_status, courier_id, note } = body;

    if (!order_id || !new_status) {
      return json({ error: "order_id ve new_status zorunludur." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch current order
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, status, merchant_id, customer_id")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return json({ error: "Sipariş bulunamadı." }, 404);
    }

    const currentStatus = order.status as OrderStatus;

    // Validate transition
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
        {
          error: `${currentStatus} → ${new_status} geçişi geçersiz.`,
        },
        400,
      );
    }

    if (!transition.allowedRoles.includes(actorRole)) {
      return json(
        {
          error: `${actorRole} bu geçişi gerçekleştiremez.`,
        },
        403,
      );
    }

    // For merchant transitions — verify actor owns this merchant
    if (actorRole === "merchant") {
      const merchantId = (
        user.app_metadata as Record<string, string> | undefined
      )?.["merchant_id"];
      if (merchantId !== order.merchant_id) {
        return json({ error: "Bu sipariş size ait değil." }, 403);
      }
    }

    // For courier transitions — verify actor is assigned
    if (actorRole === "courier") {
      const { data: assignment } = await admin
        .from("orders")
        .select("courier_id")
        .eq("id", order_id)
        .single();

      const courierId = (
        user.app_metadata as Record<string, string> | undefined
      )?.["courier_id"];

      if (!assignment || assignment.courier_id !== courierId) {
        return json({ error: "Bu sipariş size atanmamış." }, 403);
      }
    }

    if (new_status === "ASSIGNED" && actorRole === "admin" && !courier_id) {
      return json({ error: "Kurye ataması için courier_id zorunludur." }, 400);
    }

    const orderUpdate: { status: OrderStatus; courier_id?: string } = {
      status: new_status,
    };
    if (new_status === "ASSIGNED" && courier_id) {
      orderUpdate.courier_id = courier_id;
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
