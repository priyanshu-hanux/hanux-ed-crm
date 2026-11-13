import * as React from "react"
import type { RowData } from "@tanstack/react-table"

import { createActionsColumn, createSelectColumn } from "../components/columns/utility-columns"
import { FILTER_FN_BY_TYPE } from "../config/features"
import { FILTER_FNS } from "../helpers/filter-fns"
import type { ColumnDef, ColumnFilterType } from "../types/column"
import type { DataTableAction } from "../types/data-table"

/**
 * The columns the table actually renders: the caller's columns with filter functions
 * filled in from meta.filter, plus the checkbox column (when rows are selectable)
 * and the ⋯ actions column (when there are actions).
 */
export function useTableColumns<TData extends RowData, TValue>({
    columns,
    selectable,
    actions,
}: {
    columns: ColumnDef<TData, TValue>[]
    selectable: boolean
    actions: DataTableAction<TData>[]
}) {
    const withSelect = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
        const withFilterFns = (columns as ColumnDef<TData, unknown>[]).map((column) => {
            const type = column.meta?.filter?.type
            if (!type || column.filterFn) return column
            const filterValue = column.meta?.filterValue
            // Same matching rules, run on meta.filterValue instead of the column's value
            return {
                ...column,
                filterFn: filterValue ? filterOnValue(type, filterValue) : FILTER_FN_BY_TYPE[type],
            } as ColumnDef<TData, unknown>
        })
        return selectable ? [createSelectColumn<TData>(), ...withFilterFns] : withFilterFns
    }, [columns, selectable])

    return React.useMemo<ColumnDef<TData, unknown>[]>(
        () => (actions.length === 0 ? withSelect : [...withSelect, createActionsColumn(actions)]),
        [withSelect, actions]
    )
}

/** A filter function of the given type that reads `filterValue(row)` instead of the column's value */
function filterOnValue(type: ColumnFilterType, filterValue: (row: unknown) => unknown) {
    const base = FILTER_FNS[type] as unknown as ((row: FilterRow, columnId: string, value: unknown) => boolean) & {
        autoRemove?: (value: unknown) => boolean
    }
    const fn = (row: FilterRow, columnId: string, value: unknown) =>
        base({ original: row.original, getValue: () => filterValue(row.original) }, columnId, value)
    return Object.assign(fn, { autoRemove: base.autoRemove }) as unknown as ColumnDef<RowData, unknown>["filterFn"]
}

type FilterRow = { original: unknown; getValue: (columnId: string) => unknown }
