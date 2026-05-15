/**
 * Structured server-side logger.
 *
 * - Writes to stdout (captured by Vercel logs, Supabase logs, etc.)
 * - Structured JSON format for easy filtering
 * - Never logs passwords, tokens, or secrets
 * - All log calls are no-ops if LOG_LEVEL=off
 *
 * Usage:
 *   import { log } from "@/lib/logger";
 *   log.info("merchant.fetch", { userId, merchantId });
 *   log.warn("role.missing", { userId, route });
 *   log.error("order.create", { userId, reason: error.message });
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: LogLevel;
  event: string;
  [key: string]: unknown;
}

function write(level: LogLevel, event: string, data?: Record<string, unknown>) {
  if (process.env["LOG_LEVEL"] === "off") return;

  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(data ?? {}),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) =>
    write("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) =>
    write("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) =>
    write("error", event, data),
};
