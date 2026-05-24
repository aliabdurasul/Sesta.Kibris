import { cn } from "@/lib/ui/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-navy text-white hover:bg-brand-navy/90 shadow-sm",
  secondary:
    "bg-white text-text-primary ring-1 ring-border hover:bg-accent-soft",
  ghost: "bg-transparent text-text-secondary hover:bg-accent-soft",
  danger: "bg-red-600 text-white hover:bg-red-700",
  accent:
    "bg-accent-strong text-white hover:bg-accent shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm rounded-lg",
  md: "min-h-11 px-4 text-sm rounded-xl",
  lg: "min-h-12 px-6 text-base rounded-xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
