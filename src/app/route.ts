/**
 * Root route handler — returns explicit 405 for POST (health checks / bots).
 * GET is handled by app/page.tsx → redirect /merchants.
 */
import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );
}

export function PUT() {
  return POST();
}

export function PATCH() {
  return POST();
}

export function DELETE() {
  return POST();
}
