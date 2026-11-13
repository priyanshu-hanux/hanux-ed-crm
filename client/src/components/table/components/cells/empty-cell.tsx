import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * What a cell shows when it has no value: "---" in muted text. Every cell uses this,
 * so empty cells look the same in every column and table.
 * Screen readers hear "No value" instead of "dash dash dash".
 */
export function EmptyCell({
    children = "---",
    title,
    align = "start",
    className,
}: {
    /** Text to show instead of "---" */
    children?: React.ReactNode
    /** Tooltip, e.g. the invalid value that was ignored */
    title?: string
    align?: "start" | "center"
    className?: string
}) {
    return (
        <span
            title={title}
            className={cn("block text-[13px] text-muted-foreground", align === "center" && "text-center", className)}
        >
            <span aria-hidden="true">{children}</span>
            <span className="sr-only">No value</span>
        </span>
    )
}
