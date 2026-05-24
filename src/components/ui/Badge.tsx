import { cn } from "@/lib/ui/cn";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "orange";

const tones: Record<Tone, string> = {
  neutral: "bg-accent-soft text-text-secondary ring-border",
  accent: "bg-accent-soft text-accent-strong ring-accent/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  orange: "bg-brand-orange-soft text-brand-orange ring-brand-orange/20",
};

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
