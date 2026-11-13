import type { RowData } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DataTableAction } from "../../types/data-table"

/** Actions that apply to this row (an action without `show` always applies) */
export function getVisibleActions<TData extends RowData>(actions: DataTableAction<TData>[], row: TData) {
    return actions.filter((action) => !action.show || action.show(row))
}

/** The ⋯ menu with a row's actions. Renders nothing when no action applies. */
export function RowActionsMenu<TData extends RowData>({
    row,
    actions,
    srLabel,
}: {
    row: TData
    /** Already filtered with getVisibleActions */
    actions: DataTableAction<TData>[]
    /** Screen-reader label for the trigger button */
    srLabel?: string
}) {
    if (actions.length === 0) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    {srLabel && <span className="sr-only">{srLabel}</span>}
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action, index) => (
                    <DropdownMenuItem
                        key={index}
                        onClick={() => action.onClick(row)}
                        className={action.variant === "destructive" ? "text-destructive" : ""}
                    >
                        {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                        {action.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
