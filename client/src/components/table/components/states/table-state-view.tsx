import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ResolvedTableState } from "../../helpers/table-states"
import type { TableStateAction, TableStateConfig } from "../../types/states"

/**
 * A table state: icon, title, description and buttons, centered. The table uses it for
 * "no data yet", "no matches", "couldn't load" and "all columns hidden", and you can use it
 * anywhere else a list or table has nothing to show.
 */
export function TableStateView({
    icon: Icon,
    title,
    description,
    actions = [],
    tone = "default",
    compact = false,
    role,
    className,
}: TableStateConfig & {
    /** One muted line instead of the full layout */
    compact?: boolean
    /** "alert" for errors (announced right away), "status" otherwise. Default: from the tone */
    role?: "status" | "alert"
    className?: string
}) {
    const ariaRole = role ?? (tone === "destructive" ? "alert" : "status")

    if (compact) {
        return (
            <p role={ariaRole} className={cn("text-sm text-muted-foreground", className)}>
                {title}
            </p>
        )
    }

    return (
        <div
            role={ariaRole}
            className={cn("mx-auto flex max-w-md flex-col items-center px-4 text-center", className)}
        >
            {Icon && (
                <div
                    className={cn(
                        "mb-4 flex size-12 items-center justify-center rounded-xl border shadow-xs",
                        tone === "destructive"
                            ? "border-destructive/20 bg-destructive/10 text-destructive"
                            : "bg-background text-muted-foreground"
                    )}
                >
                    <Icon className="size-5" aria-hidden="true" />
                </div>
            )}
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && (
                <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-balance text-muted-foreground">
                    {description}
                </p>
            )}
            {actions.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {actions.map((action) => (
                        <StateActionButton key={action.label} action={action} />
                    ))}
                </div>
            )}
        </div>
    )
}

function StateActionButton({ action }: { action: TableStateAction }) {
    const { label, onClick, href, icon: Icon, variant = "outline", loading } = action
    const content = (
        <>
            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : Icon && <Icon aria-hidden="true" />}
            {label}
        </>
    )
    if (href) {
        return (
            <Button asChild size="sm" variant={variant}>
                <a href={href}>{content}</a>
            </Button>
        )
    }
    return (
        <Button size="sm" variant={variant} onClick={onClick} disabled={loading}>
            {content}
        </Button>
    )
}

/** Renders a state the table resolved: your own node, or the standard layout */
export function ResolvedTableStateView({ state, className }: { state: ResolvedTableState; className?: string }) {
    if (state.node) return state.node
    return <TableStateView {...state.config} compact={state.compact} className={className} />
}
