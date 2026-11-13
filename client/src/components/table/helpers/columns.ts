import type { RowData, Table } from "@tanstack/react-table"

import { ACTIONS_COLUMN_ID, SELECT_COLUMN_ID } from "../config/constants"
import type { AnyDataTableColumn, ColumnFilterConfig, DataTableFeatures, StickySide } from "../types/column"

type ColumnLike = { id?: string; accessorKey?: unknown; meta?: { filter?: ColumnFilterConfig; sticky?: StickySide } }

/** A column definition's id: `id`, or its `accessorKey` */
export function getColumnId(column: ColumnLike): string {
    return column.id ?? (column.accessorKey != null ? String(column.accessorKey) : "")
}

/** id → filter config, for every column that declares meta.filter */
export function filterConfigsOf(columns: readonly unknown[]): Map<string, ColumnFilterConfig> {
    const configs = new Map<string, ColumnFilterConfig>()
    for (const column of columns as ColumnLike[]) {
        const id = getColumnId(column)
        if (id && column.meta?.filter) configs.set(id, column.meta.filter)
    }
    return configs
}

/** Splits column ids into left-pinned, movable and right-pinned, keeping their order */
export function partitionColumnIds(columns: readonly unknown[]) {
    const leftPinnedIds: string[] = []
    const rightPinnedIds: string[] = []
    const defaultMovableIds: string[] = []
    for (const column of columns as ColumnLike[]) {
        const id = getColumnId(column)
        if (!id) continue
        const sticky = column.meta?.sticky
        if (sticky === "left") leftPinnedIds.push(id)
        else if (sticky === "right") rightPinnedIds.push(id)
        else defaultMovableIds.push(id)
    }
    return { leftPinnedIds, rightPinnedIds, defaultMovableIds }
}

/** Saved order, minus columns that no longer exist, plus new columns at the end */
export function resolveColumnOrder(order: string[], defaultIds: string[]): string[] {
    const known = new Set(defaultIds)
    const kept = order.filter((id) => known.has(id))
    const keptSet = new Set(kept)
    return [...kept, ...defaultIds.filter((id) => !keptSet.has(id))]
}

/** Display name of a column: meta.displayName, a string header, or the id */
export function labelOf(column: {
    id: string
    columnDef: { header?: unknown; meta?: { displayName?: string } }
}) {
    const header = column.columnDef.header
    return column.columnDef.meta?.displayName || (typeof header === "string" ? header : column.id)
}

/** Columns that declare meta.filter and can be filtered */
export function getFilterableColumns<TData extends RowData>(table: Table<DataTableFeatures, TData>) {
    return table
        .getAllLeafColumns()
        .filter((column) => column.columnDef.meta?.filter && column.getCanFilter()) as AnyDataTableColumn[]
}

/** Default row id: `row.id` when present, otherwise the row index */
export function defaultGetRowId<TData>(row: TData, index: number): string {
    const id = (row as { id?: unknown } | null)?.id
    return id != null ? String(id) : String(index)
}

/** Narrow utility columns get tighter padding so the checkbox / menu button fit their width */
export function cellPaddingClass(columnId: string) {
    return columnId === SELECT_COLUMN_ID ? "px-0" : columnId === ACTIONS_COLUMN_ID ? "px-2 text-center" : "px-4"
}
