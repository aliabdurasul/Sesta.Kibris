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
  | "IN_TRANSIT"
  | "DELIVERED"
  | "REJECTED"
  | "FAILED_DELIVERY"
  | "CANCELLED";

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
          order_timeout_minutes: number;
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
          customer_id: string;
          merchant_id: string;
          courier_id: string | null;
          status: OrderStatus;
          total_amount: number;
          delivery_address: Json;
          notes: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          customer_id: string;
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
          product_id: string | null;
          quantity: number;
          unit_price: number;
          snapshot: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          quantity: number;
          unit_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
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
