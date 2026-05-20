/** Validates internal redirect paths (no open redirect). */
export function isSafeRedirectPath(
  path: string | null | undefined,
): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//");
}
