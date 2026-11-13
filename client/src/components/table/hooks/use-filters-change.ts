import * as React from "react"
import type { ColumnFiltersState, RowData, Table } from "@tanstack/react-table"

import type { DataTableFeatures } from "../types/column"
import type { DataTableFiltersState } from "../types/filters"

/**
 * Reacts to applied search/filter changes:
 * server mode hands them to the parent (including filters loaded from the URL on mount),
 * client mode jumps back to the first page.
 */
export function useFiltersChange<TData extends RowData>({
    table,
    columnFilters,
    globalFilter,
    isServerFiltering,
    onFiltersChange,
}: {
    table: Table<DataTableFeatures, TData>
    columnFilters: ColumnFiltersState
    globalFilter: string
    isServerFiltering: boolean
    onFiltersChange?: (filters: DataTableFiltersState) => void
}) {
    // Skip the first render: nothing has changed yet
    const filtersMounted = React.useRef(false)

    React.useEffect(() => {
        if (!filtersMounted.current) {
            filtersMounted.current = true
            // Filters loaded from the URL: the parent's first request should include them
            if (isServerFiltering && (columnFilters.length > 0 || globalFilter)) {
                onFiltersChange?.({ columnFilters, globalFilter })
            }
            return
        }

        if (isServerFiltering) {
            onFiltersChange?.({ columnFilters, globalFilter })
        } else {
            table.setPageIndex(0)
        }
        // Only when the applied filters change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnFilters, globalFilter])
}
