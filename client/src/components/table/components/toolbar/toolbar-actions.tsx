import * as React from "react"
import { Download, MoreHorizontal, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DataTableToolbarAction } from "../../types/toolbar"

// The toolbar actions placed as buttons ("toolbar")
export function ToolbarActionButtons({ actions }: { actions: DataTableToolbarAction[] }) {
    const inline = actions.filter((action) => !action.hidden && action.placement === "toolbar")
    if (inline.length === 0) return null

    return inline.map((action) => {
        const Icon = action.icon
        return (
            <Button
                key={action.id}
                variant="ghost"
                className="shrink-0 gap-2"
                disabled={action.disabled}
                onClick={action.onSelect}
                aria-label={Icon ? action.label : undefined}
            >
                {Icon && <Icon className="size-4" />}
                <span className={Icon ? "hidden sm:inline" : undefined}>{action.label}</span>
            </Button>
        )
    })
}

/** The table's own Export item in the "⋯" menu */
export interface ToolbarExportItem {
    label: string
    /** Rows it will download, shown on the right */
    count?: number
    onSelect: () => void
}

/**
 * "⋯": Refresh and Export, then your menu actions grouped by `group` (a divider between groups) and the
 * destructive ones last. The toolbar keeps the same few buttons however many features are added.
 */
export function ToolbarMoreMenu({
    actions,
    onRefresh,
    isRefreshing = false,
    exportItem,
}: {
    actions: DataTableToolbarAction[]
    onRefresh?: () => void
    isRefreshing?: boolean
    exportItem?: ToolbarExportItem
}) {
    const items = actions.filter((action) => !action.hidden && action.placement !== "toolbar")
    const groups = groupActions(items.filter((action) => !action.destructive))
    const destructive = items.filter((action) => action.destructive)
    if (destructive.length > 0) groups.push(destructive)
    const hasBuiltIns = !!onRefresh || !!exportItem
    if (!hasBuiltIns && groups.length === 0) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0" aria-label="More table actions">
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-1.5">
                {onRefresh && (
                    <DropdownMenuItem disabled={isRefreshing} onSelect={onRefresh} className="h-9 gap-2.5">
                        <RefreshCw className={isRefreshing ? "animate-spin text-muted-foreground" : "text-muted-foreground"} />
                        {isRefreshing ? "Refreshing…" : "Refresh"}
                    </DropdownMenuItem>
                )}
                {exportItem && (
                    <DropdownMenuItem
                        disabled={exportItem.count === 0}
                        onSelect={exportItem.onSelect}
                        className="h-9 gap-2.5"
                    >
                        <Download className="text-muted-foreground" />
                        <span className="flex-1">{exportItem.label}</span>
                        {exportItem.count !== undefined && (
                            <span className="text-xs text-muted-foreground tabular-nums">{exportItem.count}</span>
                        )}
                    </DropdownMenuItem>
                )}
                {groups.map((group, index) => (
                    <React.Fragment key={group[0].id}>
                        {(index > 0 || hasBuiltIns) && <DropdownMenuSeparator className="my-1.5" />}
                        {group.map((action) => (
                            <ToolbarMenuItem key={action.id} action={action} />
                        ))}
                    </React.Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// Groups in the order they first appear; actions without a group form one group together
function groupActions(actions: DataTableToolbarAction[]) {
    const groups = new Map<string, DataTableToolbarAction[]>()
    for (const action of actions) {
        const key = action.group ?? ""
        groups.set(key, [...(groups.get(key) ?? []), action])
    }
    return [...groups.values()]
}

function ToolbarMenuItem({ action }: { action: DataTableToolbarAction }) {
    const Icon = action.icon
    return (
        <DropdownMenuItem
            disabled={action.disabled}
            variant={action.destructive ? "destructive" : "default"}
            onSelect={action.onSelect}
            className="h-9 gap-2.5"
        >
            {Icon ? (
                <Icon className={action.destructive ? undefined : "text-muted-foreground"} />
            ) : (
                <span className="size-4" aria-hidden="true" />
            )}
            <span className="flex-1 truncate">{action.label}</span>
            {action.shortcut && <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>}
        </DropdownMenuItem>
    )
}
