import { cn } from "@/lib/utils";

/** Green = within calling hours, amber = outside. Always pair with text for accessibility. */
export function StatusDot({ good, className }: { good: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full", good ? "bg-emerald-500" : "bg-amber-500", className)}
    />
  );
}
