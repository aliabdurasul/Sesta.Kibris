import { cn } from "@/lib/ui/cn";

type Variant = "info" | "success" | "warning" | "error";

const styles: Record<Variant, string> = {
  info: "bg-accent-soft text-text-primary ring-accent/30",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-brand-orange-soft text-amber-900 ring-brand-orange/30",
  error: "bg-red-50 text-red-800 ring-red-200",
};

export function Alert({
  variant = "info",
  className,
  children,
  title,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("rounded-xl px-4 py-3 text-sm ring-1", styles[variant], className)}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
