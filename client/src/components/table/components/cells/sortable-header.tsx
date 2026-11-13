import type { Column, RowData } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { appIcons } from "@/configs/icons"
import type { ColumnDef, DataTableFeatures } from "../../types/column"
import { ColumnHeaderLabel } from "./column-header-label"

/** A column header button that cycles sorting: none → ascending → descending → none */
export function createSortableHeader<TData extends RowData>(
    title: string,
): ColumnDef<TData, unknown>["header"] {
    const SortableHeader = ({ column }: { column: Column<DataTableFeatures, TData, unknown> }) => {
        const sorted = column.getIsSorted()

        const cycleSorting = () => {
            if (sorted === false) column.toggleSorting(false)      // asc
            else if (sorted === "asc") column.toggleSorting(true)  // desc
            else column.clearSorting()                             // back to the loaded order
        }

        const nextLabel =
            sorted === false ? "ascending" : sorted === "asc" ? "descending" : "unsorted"

        return (
            <Button
                variant="ghost"
                onClick={cycleSorting}
                aria-label={`Sort by ${title}, ${nextLabel}`}
                // max-w: the button may use the column's width plus the 12px it pulls left (-ml-3), no more;
                // min-w-0 lets it shrink so a narrow column truncates the title instead of overflowing
                className="text-[13px] -ml-3 flex h-8 min-w-0 max-w-[calc(100%+0.75rem)] gap-2 px-3"
            >
                <ColumnHeaderLabel column={column} title={title} />
                {sorted === "asc" ? (
                    <appIcons.ascOrder />
                ) : sorted === "desc" ? (
                    <appIcons.descOrder />
                ) : (
                    <appIcons.arrowUpDown className="size-3.5 opacity-20" />
                )}
            </Button>
        )
    }

    SortableHeader.displayName = `SortableHeader-${title}`
    return SortableHeader
}
