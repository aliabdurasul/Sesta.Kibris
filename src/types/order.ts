import type { Database } from "@/types/database";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

export type ActiveOrder = Pick<
  OrderRow,
  "id" | "status" | "total_amount" | "delivery_address" | "customer_notes" | "created_at"
> & {
  order_items: Pick<
    OrderItemRow,
    "id" | "quantity" | "unit_price" | "product_name" | "line_total"
  >[];
};
