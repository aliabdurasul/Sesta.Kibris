/**
 * Supabase Database Types
 *
 * Canonical schema — aligned with migrations 00001–00017.
 * Replace this file by running: supabase gen types typescript --local > src/types/database.ts
 *
 * CANONICAL RULES (enforced by migration 00016):
 *   - customers.user_id  = auth.users.id  (app queries use user_id)
 *   - merchants.user_id  = auth.users.id  (app queries use user_id)
 *   - couriers.user_id   = auth.users.id  (merchant_id nullable)
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
      products: {
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
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          merchant_id: string;
          name: string;
          price: number;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
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
