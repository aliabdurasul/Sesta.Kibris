import { cn } from "@/lib/ui/cn";
import type { UiContext } from "@/lib/ui/context";

export function ShellMain({
  context,
  children,
  className,
}: {
  context: UiContext;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "shell-main flex-1 overflow-x-auto",
        context === "consumer" ? "shell-main--consumer" : "shell-main--operator",
        className,
      )}
    >
      <div className="shell-main-inner">{children}</div>
    </main>
  );
}
