import type { Header, RowData, Table } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import {
    DEFAULT_MAX_COLUMN_SIZE,
    DEFAULT_MIN_COLUMN_SIZE,
    RESIZE_STEP,
    RESIZE_STEP_LARGE,
} from "../../config/constants"
import type { DataTableFeatures } from "../../types/column"

// Drag handle on a header cell's right edge. Double-click resets the width. 
// ←/→ resize by 10px (Shift: 50px) within the column's min/max.

export function ColumnResizer<TData extends RowData>({
    table,
    header,
    label,
}: {
    table: Table<DataTableFeatures, TData>
    header: Header<DataTableFeatures, TData, unknown>
    label: string
}) {
    const column = header.column
    const resizeHandler = header.getResizeHandler()
    const min = column.columnDef.minSize ?? DEFAULT_MIN_COLUMN_SIZE
    const max = column.columnDef.maxSize ?? DEFAULT_MAX_COLUMN_SIZE

    const resizeBy = (delta: number) => {
        const next = Math.min(max, Math.max(min, column.getSize() + delta))
        table.setColumnSizing((prev) => ({ ...prev, [column.id]: next }))
    }

    return (
        <div
            role="separator"
            aria-orientation="vertical"
            aria-label={`Resize ${label} column`}
            aria-valuenow={Math.round(column.getSize())}
            aria-valuemin={min}
            aria-valuemax={max}
            tabIndex={0}
            title="Drag to resize, double-click to reset"
            onMouseDown={resizeHandler}
            onTouchStart={resizeHandler}
            onDoubleClick={() => column.resetSize()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
                const step = event.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP
                if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    resizeBy(-step)
                } else if (event.key === "ArrowRight") {
                    event.preventDefault()
                    resizeBy(step)
                }
            }}
            className={cn("data-table-resizer", column.getIsResizing() && "is-resizing")}
        />
    )
}
