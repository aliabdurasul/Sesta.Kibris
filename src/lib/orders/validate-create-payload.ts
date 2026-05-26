/**
 * Validates POST /api/orders/create body before proxying to edge function.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ValidatedOrderItem {
  product_id: string;
  quantity: number;
}

export type CheckoutPaymentMethod = "cod" | "card";

export interface ValidatedCreateOrderPayload {
  merchant_id: string;
  items: ValidatedOrderItem[];
  delivery_address: { full_address: string; district: string };
  customer_notes: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
  /** Optional — card sets payment fields on order; default is COD (null columns). */
  payment_method?: CheckoutPaymentMethod;
}

export type ValidateCreateOrderResult =
  | { ok: true; payload: ValidatedCreateOrderPayload }
  | { ok: false; code: string; error: string; details?: Record<string, unknown> };

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function validateCreateOrderBody(
  body: Record<string, unknown>,
): ValidateCreateOrderResult {
  const merchantId = asString(body["merchant_id"]);
  if (!merchantId || !UUID_RE.test(merchantId)) {
    return {
      ok: false,
      code: "INVALID_MERCHANT_ID",
      error: "Geçersiz market kimliği.",
      details: { merchant_id: merchantId },
    };
  }

  const rawItems = body["items"];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return {
      ok: false,
      code: "EMPTY_CART",
      error: "Sepet boş — sipariş oluşturulamaz.",
    };
  }

  const items: ValidatedOrderItem[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const row = rawItems[i] as Record<string, unknown> | null;
    if (!row || typeof row !== "object") {
      return {
        ok: false,
        code: "INVALID_ITEM",
        error: `Sepet kalemi ${i + 1} geçersiz.`,
      };
    }

    const productId = asString(row["product_id"]);
    if (!productId || !UUID_RE.test(productId)) {
      return {
        ok: false,
        code: "INVALID_PRODUCT_ID",
        error: `Geçersiz ürün kimliği (kalem ${i + 1}).`,
        details: { index: i, product_id: productId },
      };
    }

    const qtyRaw = row["quantity"];
    const quantity =
      typeof qtyRaw === "number"
        ? qtyRaw
        : typeof qtyRaw === "string"
          ? parseInt(qtyRaw, 10)
          : NaN;

    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return {
        ok: false,
        code: "INVALID_QUANTITY",
        error: `Geçersiz adet (kalem ${i + 1}).`,
        details: { index: i, quantity: qtyRaw },
      };
    }

    items.push({ product_id: productId, quantity });
  }

  const addr = body["delivery_address"] as Record<string, unknown> | null;
  const fullAddress = addr ? asString(addr["full_address"]) : null;
  const district = addr ? asString(addr["district"]) : null;

  if (!fullAddress || !district) {
    return {
      ok: false,
      code: "INVALID_ADDRESS",
      error: "Teslimat adresi eksik.",
    };
  }

  const notes =
    asString(body["customer_notes"]) ?? asString(body["notes"]) ?? null;

  let payment_method: CheckoutPaymentMethod | undefined;
  const pmRaw = body["payment_method"];
  if (pmRaw === "card" || pmRaw === "cod") {
    payment_method = pmRaw;
  } else if (pmRaw != null && pmRaw !== "") {
    return {
      ok: false,
      code: "INVALID_PAYMENT_METHOD",
      error: "Geçersiz ödeme yöntemi.",
    };
  }

  return {
    ok: true,
    payload: {
      merchant_id: merchantId,
      items,
      delivery_address: { full_address: fullAddress, district },
      customer_notes: notes,
      guest_name: asString(body["guest_name"]),
      guest_phone: asString(body["guest_phone"]),
      guest_email: asString(body["guest_email"]),
      payment_method,
    },
  };
}
