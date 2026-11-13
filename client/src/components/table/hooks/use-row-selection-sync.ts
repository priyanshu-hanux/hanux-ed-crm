import * as React from "react"
import type { RowData, RowSelectionState, Table } from "@tanstack/react-table"

import type { DataTableFeatures } from "../types/column"

/**
 * Keeps the selection in step with the data:
 * drops entries for rows that no longer exist (delete, refresh, refetch)
 * and reports the selected rows to the parent.
 */
export function useRowSelectionSync<TData extends RowData>({
    table,
    data,
    resolveRowId,
    rowSelection,
    setRowSelection,
    onRowSelect,
}: {
    table: Table<DataTableFeatures, TData>
    data: TData[]
    resolveRowId: (row: TData, index: number) => string
    rowSelection: RowSelectionState
    setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
    onRowSelect?: (selectedRows: TData[]) => void
}) {
    React.useEffect(() => {
        const ids = new Set(data.map((row, index) => resolveRowId(row, index)))
        setRowSelection((prev) => {
            const keys = Object.keys(prev)
            const kept = keys.filter((id) => ids.has(id))
            if (kept.length === keys.length) return prev
            const next: RowSelectionState = {}
            for (const id of kept) next[id] = true
            return next
        })
    }, [data, resolveRowId, setRowSelection])

    // Report selection to the parent whenever it, or the underlying data, changes
    React.useEffect(() => {
        if (!onRowSelect) return
        onRowSelect(table.getFilteredSelectedRowModel().rows.map((row) => row.original))
        // table is a stable instance; the selection and data are what change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowSelection, data, onRowSelect])
}
