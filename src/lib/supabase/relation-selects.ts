/**
 * Explicit PostgREST relation embeds — never use implicit merchants(*) / couriers(*).
 * Aliases match response keys: merchant, courier, customer.
 */

/** Order → merchant (orders.merchant_id) */
export const orderMerchantEmbed = (
  fields: string,
) => `merchant:merchants!orders_merchant_id_fkey(${fields})`;

/** Order → courier (orders.courier_id) */
export const orderCourierEmbed = (fields: string) =>
  `courier:couriers!orders_courier_id_fkey(${fields})`;

/** Courier row → merchant (couriers.merchant_id) */
export const courierMerchantEmbed = (fields: string) =>
  `merchant:merchants!couriers_merchant_id_fkey(${fields})`;

/** Order → customer (orders.customer_id) */
export const orderCustomerEmbed = (fields: string) =>
  `customer:customers!orders_customer_id_fkey(${fields})`;

export const ORDER_MERCHANT_ADMIN = orderMerchantEmbed(
  "name, delivery_mode, hybrid_assign_timeout_minutes",
);

export const ORDER_MERCHANT_NAME = orderMerchantEmbed("name");

export const ORDER_MERCHANT_NAME_PHONE = orderMerchantEmbed("name, phone");

export const ORDER_MERCHANT_COURIER_PANEL = orderMerchantEmbed(
  "name, address, phone",
);

export const ORDER_MERCHANT_HYBRID_CRON = orderMerchantEmbed(
  "delivery_mode, hybrid_assign_timeout_minutes",
);

export const COURIER_MERCHANT_NAME = courierMerchantEmbed("name");
