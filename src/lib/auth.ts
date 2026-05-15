/**
 * Auth utilities for server components, layouts, and Server Actions.
 * Centralizes session access and role checks.
 * NEVER import this in client components.
 */
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/supabase/server";

export type UserRole = "customer" | "merchant" | "courier" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  merchantId?: string;
  courierId?: string;
}

/**
 * Returns the current authenticated user with typed role from app_metadata.
 * Returns null if no session.
 */
export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const meta = user.app_metadata as Record<string, string> | undefined;
  const role = meta?.["role"] as UserRole | undefined;

  if (!role) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    merchantId: meta?.["merchant_id"],
    courierId: meta?.["courier_id"],
  };
}

/**
 * Returns session or redirects to /auth/login.
 * Use in protected server components and layouts.
 */
export async function requireSession(redirectTo?: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    const params = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/auth/login${params}`);
  }
  return session;
}

/**
 * Returns session only if role matches. Otherwise redirects to correct dashboard.
 */
export async function requireRole(allowedRole: UserRole): Promise<SessionUser> {
  const session = await requireSession();

  if (session.role !== allowedRole) {
    switch (session.role) {
      case "merchant":
        redirect("/merchant");
      case "courier":
        redirect("/courier");
      case "admin":
        redirect("/admin");
      default:
        redirect("/customer/orders");
    }
  }

  return session;
}

/**
 * Redirect map: role → home route
 */
export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case "merchant":
      return "/merchant";
    case "courier":
      return "/courier";
    case "admin":
      return "/admin";
    default:
      return "/customer/orders";
  }
}

/**
 * Signs out the current user. Use in Server Actions.
 */
export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
