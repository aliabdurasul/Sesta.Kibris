/**
 * Shared types for the setup-admin flow.
 *
 * Extracted from setup-admin/actions.ts because "use server" files
 * may only export async functions. Shared types must live in separate files
 * importable by both server actions and client components.
 */

export type SetupAdminState =
  | { status: "idle" }
  | { status: "success"; email: string; temporaryPassword: string }
  | { status: "error"; message: string };
