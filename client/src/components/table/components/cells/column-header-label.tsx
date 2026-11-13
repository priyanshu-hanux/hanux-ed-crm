import * as React from "react"

import { cn } from "@/lib/utils"
import type { DataTableColumnMeta } from "../../types/column"

/** Any column: only its `meta.icon` is read */
type ColumnWithMeta = { columnDef: { meta?: DataTableColumnMeta } }

/** Whether headers show their column's `meta.icon`. Set by the table from the Columns dialog setting. */
export const HeaderIconsContext = React.createContext(true)

/** A column's `meta.icon`, or nothing. Used by headers, the Columns dialog and the Filters menu. */
export function ColumnIcon({
    column,
    className,
}: {
    column: ColumnWithMeta
    className?: string
}) {
    const Icon = column.columnDef.meta?.icon
    if (!Icon) return null
    return (
        <span aria-hidden="true" className="inline-flex shrink-0">
            <Icon className={cn("size-3.5 text-muted-foreground", className)} />
        </span>
    )
}

/**
 * A header's text with the column's icon in front (when it has one and header icons are on).
 * Plain string headers and createSortableHeader use this automatically; use it in your own
 * header components to get the same look.
 */
export function ColumnHeaderLabel({
    column,
    title,
}: {
    column: ColumnWithMeta
    title: React.ReactNode
}) {
    const showIcons = React.useContext(HeaderIconsContext)
    return (
        <span className="inline-flex min-w-0 items-center gap-1.5">
            {showIcons && <ColumnIcon column={column} />}
            <span className="truncate">{title}</span>
        </span>
    )
}
