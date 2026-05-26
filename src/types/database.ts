/**
 * Supabase Database Types
 *
 * Canonical schema — aligned with migrations 00001–00040.
 * Replace this file by running: supabase gen types typescript --local > src/types/database.ts
 *
 * CANONICAL RULES (enforced by migration 00016):
 *   - customers.user_id  = auth.users.id  (app queries use user_id)
 *   - merchants.user_id  = auth.users.id  (app queries use user_id)
 *   - couriers.user_id   = auth.users.id  (merchant_id nullable)
 *
 * CATALOG RULES (enforced by migrations 00034–00040):
 *   - global_products     = admin-owned shared catalog (slug unique, is_active)
 *   - product_categories  = admin-managed category tree (icon_url, parent_id)
 *   - merchant_inventory  = merchant-scoped price/stock/availability per product
 *   - product_suggestions = merchant suggestions pending admin approval
 *   - products (VIEW)     = backward-compat shim over merchant_inventory + global_products
 *
 * All tables: user_id is the canonical FK to auth.users.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
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

export type DeliveryMode =
  | "MERCHANT_DELIVERY"
  | "PLATFORM_COURIER"
  | "HYBRID";

export type UserRole = "customer" | "merchant" | "courier" | "admin";

export type SuggestionStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DUPLICATE";

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string;
          user_id: string;
          owner_user_id: string;
          name: string;
          slug: string;
          category: string;
          address: string;
          phone: string;
          is_active: boolean;
          is_open: boolean;
          minimum_order_amount: number | null;
          order_timeout_minutes: number;
          delivery_mode: DeliveryMode;
          default_courier_id: string | null;
          hybrid_assign_timeout_minutes: number;
          logo_url: string | null;
          cover_image_url: string | null;
          profile_address: string | null;
          whatsapp_phone: string | null;
          description: string | null;
          opening_hours: Json | null;
          delivery_time_min: number | null;
          delivery_time_max: number | null;
          delivery_fee: number | null;
          features: Json;
          is_demo_market: boolean;
          is_onboarded: boolean;
          updated_by_merchant: boolean;
          onboarded_at: string | null;
          accepts_online_payment: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchants"]["Row"]> & {
          name: string;
          slug: string;
          category: string;
          user_id: string;
          owner_user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchants"]["Row"]>;
      };
      merchant_slug_redirects: {
        Row: {
          old_slug: string;
          merchant_id: string;
          created_at: string;
        };
        Insert: {
          old_slug: string;
          merchant_id: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["merchant_slug_redirects"]["Row"]
        >;
      };
      legacy_merchant_products: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          description: string | null;
          /** Price in kuruş (1/100 TL) */
          price: number;
          unit: string;
          /** NULL = unlimited stock */
          stock_count: number | null;
          is_available: boolean;
          image_url: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["legacy_merchant_products"]["Row"]> & {
          merchant_id: string;
          name: string;
          price: number;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["legacy_merchant_products"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          /** Canonical FK to auth.users.id — equal to id for all rows */
          user_id: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      customer_addresses: {
        Row: {
          id: string;
          customer_id: string;
          label: string | null;
          full_address: string;
          district: string;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["customer_addresses"]["Row"]
        > & {
          customer_id: string;
          full_address: string;
          district: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["customer_addresses"]["Row"]
        >;
      };
      couriers: {
        Row: {
          id: string;
          user_id: string;
          /** Nullable — platform couriers have no merchant_id */
          merchant_id: string | null;
          full_name: string | null;
          phone: string | null;
          vehicle_type: string | null;
          is_active: boolean;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["couriers"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["couriers"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          /** Nullable for guest checkout (migration 00019) */
          customer_id: string | null;
          merchant_id: string;
          courier_id: string | null;
          status: OrderStatus;
          total_amount: number;
          delivery_address: Json;
          customer_notes: string | null;
          merchant_notes: string | null;
          guest_user_id: string | null;
          guest_token: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          guest_email: string | null;
          rejection_reason: string | null;
          failure_reason: string | null;
          created_at: string;
          accepted_at: string | null;
          ready_at: string | null;
          assigned_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          assignment_escalated_at: string | null;
          payment_method: string | null;
          payment_status: string | null;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          commission_amount: number | null;
          paid_at: string | null;
          merchant_settled_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          merchant_id: string;
          status: OrderStatus;
          total_amount: number;
          delivery_address: Json;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          product_id: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
      };
      merchant_stripe_accounts: {
        Row: {
          id: string;
          merchant_id: string;
          user_id: string;
          stripe_account_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          merchant_id: string;
          user_id: string;
          stripe_account_id: string;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["merchant_stripe_accounts"]["Row"]
        >;
      };
      stripe_products: {
        Row: {
          id: string;
          merchant_id: string;
          stripe_product_id: string;
          stripe_price_id: string;
          name: string;
          description: string | null;
          unit_amount: number;
          currency: string;
          inventory_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          merchant_id: string;
          stripe_product_id: string;
          stripe_price_id: string;
          name: string;
          unit_amount: number;
          description?: string | null;
          currency?: string;
          inventory_id?: string | null;
          is_active?: boolean;
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stripe_products"]["Row"]>;
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          event_type: string;
          processed_at: string | null;
          last_error: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          stripe_event_id: string;
          event_type: string;
          payload?: Json | null;
          processed_at?: string | null;
          last_error?: string | null;
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["stripe_webhook_events"]["Row"]
        >;
      };
      user_roles: {
        Row: {
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: UserRole;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
      };
      order_status_log: {
        Row: {
          id: string;
          order_id: string;
          from_status: OrderStatus | null;
          to_status: OrderStatus;
          status: OrderStatus;
          actor_id: string | null;
          actor_role: string;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["order_status_log"]["Row"]
        > & {
          order_id: string;
          to_status: OrderStatus;
          status: OrderStatus;
          actor_role: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_log"]["Row"]>;
      };
      /** @deprecated READ-ONLY view over merchant_inventory + global_products. Do not write to this. */
      products: {
        Row: {
          id: string;              // merchant_inventory.id
          merchant_id: string;
          product_id: string;      // global_products.id
          name: string;
          description: string | null;
          price: number;           // kuruş
          unit: string;
          stock_count: number | null;
          is_available: boolean;
          image_url: string | null;
          display_order: number;
          created_at: string;      // merchant_inventory.attached_at
          updated_at: string;
          // Bonus columns (new schema only)
          category_id: string | null;
          brand: string | null;
          slug: string;
          tags: string[];
          image_urls: Json;
        };
        Insert: never; // View is read-only — write to merchant_inventory or global_products
        Update: never;
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          icon_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_categories"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Row"]>;
      };
      global_products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          name_tr: string | null;
          slug: string;
          description: string | null;
          brand: string | null;
          unit: string;
          variant_group_id: string | null;
          image_url: string | null;
          image_urls: Json;          // [{url, label, is_primary}][]
          tags: string[];
          is_active: boolean;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string;
          from_suggestion_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["global_products"]["Row"]> & {
          name: string;
          unit: string;
          slug: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["global_products"]["Row"]>;
      };
      merchant_inventory: {
        Row: {
          id: string;
          merchant_id: string;
          product_id: string;
          price: number;             // kuruş (1/100 TL)
          stock_count: number | null; // null = unlimited
          is_available: boolean;
          display_order: number;
          attached_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_inventory"]["Row"]> & {
          merchant_id: string;
          product_id: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_inventory"]["Row"]>;
      };
      product_suggestions: {
        Row: {
          id: string;
          merchant_id: string;
          submitted_by: string;
          status: SuggestionStatus;
          name: string;
          description: string | null;
          brand: string | null;
          unit: string;
          category_hint: string | null;
          image_url: string | null;
          merchant_notes: string | null;
          similarity_score: number | null; // 0.000–1.000
          duplicate_of: string | null;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          global_product_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_suggestions"]["Row"]> & {
          merchant_id: string;
          submitted_by: string;
          name: string;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_suggestions"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_has_role: {
        Args: { check_role: string };
        Returns: boolean;
      };
      user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      user_merchant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      user_courier_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}
