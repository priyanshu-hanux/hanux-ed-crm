import type { RowData } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"
import { ACTIONS_COLUMN_ID, SELECT_COLUMN_ID } from "../../config/constants"
import type { ColumnDef } from "../../types/column"
import type { DataTableAction } from "../../types/data-table"
import { getVisibleActions, RowActionsMenu } from "../cells/row-actions-menu"

/** Checkbox column pinned to the left; the header checkbox selects the current page */
export function createSelectColumn<TData extends RowData>(): ColumnDef<TData, unknown> {
    return {
        id: SELECT_COLUMN_ID,
        size: 56,
        minSize: 56,
        maxSize: 56,
        enableResizing: false,
        meta: {
            sticky: "left",
        },
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    }
}

/** ⋯ menu column pinned to the right */
export function createActionsColumn<TData extends RowData>(
    actions: DataTableAction<TData>[]
): ColumnDef<TData, unknown> {
    return {
        id: ACTIONS_COLUMN_ID,
        size: 60,
        minSize: 60,
        maxSize: 80,
        enableResizing: false,
        meta: {
            sticky: "right",
        },
        header: "Actions",
        cell: ({ row }) => (
            <RowActionsMenu
                row={row.original}
                actions={getVisibleActions(actions, row.original)}
                srLabel="Open menu"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    }
}
