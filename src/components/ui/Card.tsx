import { cn } from "@/lib/ui/cn";

export function Card({
  className,
  children,
  padding = "md",
}: {
  className?: string;
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  const pad =
    padding === "none"
      ? ""
      : padding === "sm"
        ? "p-3"
        : padding === "lg"
          ? "p-6"
          : "p-4";

  return (
    <div
      className={cn(
        "rounded-2xl bg-brand-white shadow-sm ring-1 ring-border",
        pad,
        className,
      )}
    >
      {children}
    </div>
  );
}
