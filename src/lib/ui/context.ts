/** UI density / audience — same components, different presentation. */
export type UiContext = "consumer" | "operator";
export type UiDensity = "comfortable" | "compact";

export function densityForContext(context: UiContext): UiDensity {
  return context === "operator" ? "compact" : "comfortable";
}
