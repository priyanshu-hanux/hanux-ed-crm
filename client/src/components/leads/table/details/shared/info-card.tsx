import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

/** A bordered card with a header strip (icon, title, count, action), used for every section in the drawer */
export function InfoCard({
  icon: Icon,
  title,
  count,
  action,
  tone = "default",
  className,
  bodyClassName,
  children,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  /** Small pill next to the title */
  count?: ReactNode;
  /** Right-aligned control in the header, e.g. a "Replace" button */
  action?: ReactNode;
  /** "danger" tints the card red, e.g. for overdue items */
  tone?: "default" | "danger";
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-xs",
        tone === "danger" && "border-red-200 dark:border-red-500/30",
        className
      )}
    >
      <header
        className={cn(
          "flex min-h-10 items-center gap-2 border-b bg-muted/40 px-4 py-2",
          tone === "danger" && "border-red-200 bg-red-50/70 dark:border-red-500/30 dark:bg-red-500/10"
        )}
      >
        {Icon && (
          <Icon
            className={cn("size-4 shrink-0", tone === "danger" ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}
            aria-hidden="true"
          />
        )}
        <h3 className={cn("text-[13px] font-semibold", tone === "danger" ? "text-red-700 dark:text-red-300" : "text-foreground")}>
          {title}
        </h3>
        {count != null && (
          <span className="rounded-full border bg-background px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
        {action && <div className="ml-auto flex items-center">{action}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Rows of label/value pairs inside an InfoCard */
export function InfoList({ children }: { children: ReactNode }) {
  return <dl className="divide-y">{children}</dl>;
}

/** One label/value row: icon + label on the left, value on the right (can be several lines), optional copy button */
export function InfoRow({
  icon: Icon,
  label,
  value,
  copyText,
}: {
  icon?: LucideIcon;
  label: string;
  value?: ReactNode;
  copyText?: string | null;
}) {
  const isEmpty = value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="group flex items-start gap-3 px-4 py-2.5">
      <dt className="flex h-6 w-32 shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
        {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="min-w-0 flex-1 wrap-break-word py-0.5 text-sm font-medium text-foreground">
        {isEmpty ? <span className="font-normal text-muted-foreground/70">Not provided</span> : value}
      </dd>
      {copyText && !isEmpty && <CopyButton text={copyText} label={label.toLowerCase()} />}
    </div>
  );
}
