import * as React from "react"
import { flexRender, type Cell, type Column, type Row, type RowData } from "@tanstack/react-table"

import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { SELECT_COLUMN_ID } from "../../config/constants"
import { cellPaddingClass } from "../../helpers/columns"
import { resolveCopyLabel, resolveCopyText } from "../../helpers/clipboard"
import type { GetSticky } from "../../hooks/use-sticky-columns"
import type { DataTableFeatures } from "../../types/column"
import { CopyableCell } from "../cells/copyable-cell"
import type { ResolvedTableState } from "../../helpers/table-states"
import { ResolvedTableStateView } from "../states/table-state-view"
import { SkeletonCellContent } from "../states/skeleton"

// Centers a message within the visible width, even when the table is wider than the screen

function FullWidthRow({
    colSpan,
    className,
    children,
}: {
    colSpan: number
    className?: string
    children: React.ReactNode
}) {
    return (
        <TableRow className={className}>
            <TableCell colSpan={colSpan} className="p-0">
                {children}
            </TableCell>
        </TableRow>
    )
}

interface TableBodyRowsProps<TData extends RowData> {
    // Rows on the current page
    rows: Row<DataTableFeatures, TData>[]
    visibleColumns: Column<DataTableFeatures, TData, unknown>[]
    getSticky: GetSticky
    showSkeleton: boolean
    skeletonCount: number
    // Row whose details drawer is open
    activeRowId: string | null
    // Row in the tab order
    rovingRowId: string | null
    // Rows open the details drawer
    clickable: boolean
    onRowFocus: (rowId: string) => void
    onRowKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>, row: Row<DataTableFeatures, TData>) => void
    onRowClick: (event: React.MouseEvent, rowId: string) => void
    // Keep showing the last rendered rows (e.g. while a column is being resized)
    frozen?: boolean
    /** What to show instead of rows (no data, no matches, load failed, all columns hidden); null = show the rows */
    state: ResolvedTableState | null
}

function TableBodyRowsImpl<TData extends RowData>({
    rows,
    visibleColumns,
    getSticky,
    showSkeleton,
    skeletonCount,
    activeRowId,
    rovingRowId,
    clickable,
    onRowFocus,
    onRowKeyDown,
    onRowClick,
    state,
}: TableBodyRowsProps<TData>) {
    // Rows skip re-rendering when nothing about them changed, so they must not hold on to
    // handlers from an older render: give them stable wrappers that call the latest ones.
    const latest = React.useRef({ onRowFocus, onRowKeyDown, onRowClick })
    React.useLayoutEffect(() => {
        latest.current = { onRowFocus, onRowKeyDown, onRowClick }
    })
    const handleRowFocus = React.useCallback((rowId: string) => latest.current.onRowFocus(rowId), [])
    const handleRowKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLTableRowElement>, row: Row<DataTableFeatures, TData>) =>
            latest.current.onRowKeyDown(event, row),
        []
    )
    const handleRowClick = React.useCallback(
        (event: React.MouseEvent, rowId: string) => latest.current.onRowClick(event, rowId),
        []
    )

    // The pinned-column layout as text; rows re-render when it changes (e.g. a column was resized)
    const stickyKey = visibleColumns
        .map((column) => {
            const sticky = getSticky(column.id)
            return `${sticky.side ?? ""}:${sticky.edge ?? ""}:${JSON.stringify(sticky.style ?? null)}`
        })
        .join("|")

    if (showSkeleton) {
        return Array.from({ length: skeletonCount }, (_, rowIndex) => (
            <TableRow key={`skeleton-${rowIndex}`} data-skeleton="" aria-hidden="true">
                {visibleColumns.map((column, colIndex) => {
                    const sticky = getSticky(column.id)
                    return (
                        <TableCell
                            key={column.id}
                            data-sticky={sticky.side}
                            data-sticky-edge={sticky.edge}
                            className={`${cellPaddingClass(column.id)} h-13 py-1.5`}
                            style={sticky.style}
                        >
                            <SkeletonCellContent
                                columnId={column.id}
                                variant={column.columnDef.meta?.skeleton}
                                row={rowIndex}
                                col={colIndex}
                            />
                        </TableCell>
                    )
                })}
            </TableRow>
        ))
    }

    // No data, no matches, load failed or all columns hidden: one message across the whole width
    if (state) {
        return (
            <FullWidthRow colSpan={visibleColumns.length} className="hover:bg-transparent">
                <div className="sticky left-0 py-14" style={{ width: "var(--dt-body-width, 100%)" }}>
                    <ResolvedTableStateView state={state} />
                </div>
            </FullWidthRow>
        )
    }

    return rows.map((row) => (
        <DataRow
            key={row.id}
            row={row}
            visibleColumns={visibleColumns}
            getSticky={getSticky}
            stickyKey={stickyKey}
            isSelected={row.getIsSelected()}
            isActive={row.id === activeRowId}
            isTabbable={row.id === rovingRowId}
            clickable={clickable}
            onRowFocus={handleRowFocus}
            onRowKeyDown={handleRowKeyDown}
            onRowClick={handleRowClick}
        />
    ))
}

type StickyCell = ReturnType<GetSticky>

/** One cell: its content, wrapped in a copy button when the column is copyable */
function DataCellImpl<TData extends RowData>({
    cell,
    sticky,
}: {
    cell: Cell<DataTableFeatures, TData, unknown>
    sticky: StickyCell
    /** Only set for the checkbox cell; used by the comparison below */
    isSelected?: boolean
}) {
    const meta = cell.column.columnDef.meta
    const content = flexRender(cell.column.columnDef.cell, cell.getContext())
    const copyText = resolveCopyText(meta?.copyable, cell.getValue(), cell.row.original)
    return (
        <TableCell
            data-sticky={sticky.side}
            data-sticky-edge={sticky.edge}
            className={`${cellPaddingClass(cell.column.id)} py-1.5 whitespace-normal`}
            style={sticky.style}
        >
            {copyText ? (
                <CopyableCell text={copyText} label={resolveCopyLabel(meta)}>
                    {content}
                </CopyableCell>
            ) : (
                content
            )}
        </TableCell>
    )
}

const sameSticky = (a: StickyCell, b: StickyCell) =>
    a.side === b.side && a.edge === b.edge && JSON.stringify(a.style ?? null) === JSON.stringify(b.style ?? null)

/**
 * A cell re-renders only when its own data or column changed (TanStack gives it a new cell
 * object then), its pinned position moved, or — for the checkbox cell — the selection changed.
 */
const DataCell = React.memo(
    DataCellImpl,
    (prev, next) => prev.cell === next.cell && prev.isSelected === next.isSelected && sameSticky(prev.sticky, next.sticky)
) as typeof DataCellImpl

interface DataRowProps<TData extends RowData> {
    row: Row<DataTableFeatures, TData>
    /** Only compared: a new array means columns were shown, hidden, moved or redefined */
    visibleColumns: Column<DataTableFeatures, TData, unknown>[]
    getSticky: GetSticky
    /** Pinned-column layout as text, so the comparison sees when offsets change */
    stickyKey: string
    isSelected: boolean
    isActive: boolean
    isTabbable: boolean
    clickable: boolean
    onRowFocus: (rowId: string) => void
    onRowKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>, row: Row<DataTableFeatures, TData>) => void
    onRowClick: (event: React.MouseEvent, rowId: string) => void
}

/** One data row. Memoized (see below) so selecting a row doesn't re-render every other row. */
function DataRowImpl<TData extends RowData>({
    row,
    getSticky,
    isSelected,
    isActive,
    isTabbable,
    clickable,
    onRowFocus,
    onRowKeyDown,
    onRowClick,
}: DataRowProps<TData>) {
    return (
        <TableRow
            data-row-id={row.id}
            data-state={isSelected ? "selected" : undefined}
            data-active={isActive || undefined}
            tabIndex={isTabbable ? 0 : -1}
            onFocus={(event) => {
                if (event.target === event.currentTarget) onRowFocus(row.id)
            }}
            onKeyDown={(event) => onRowKeyDown(event, row)}
            onClick={(event) => onRowClick(event, row.id)}
            className={cn(
                "group outline-none hover:bg-transparent data-[state=selected]:bg-transparent",
                clickable && "cursor-pointer"
            )}
        >
            {row.getVisibleCells().map((cell) => (
                <DataCell
                    key={cell.id}
                    cell={cell}
                    sticky={getSticky(cell.column.id)}
                    // Only the checkbox cell shows selection; other cells skip re-rendering when it changes
                    isSelected={cell.column.id === SELECT_COLUMN_ID ? isSelected : undefined}
                />
            ))}
        </TableRow>
    )
}

/**
 * Re-render a row only when something it shows changed: its data, its selected / active /
 * focusable state, the visible columns, or the pinned-column layout.
 * getSticky and the handlers are left out on purpose: getSticky is covered by stickyKey,
 * and the handlers passed in are stable wrappers that always call the latest version.
 */
const DataRow = React.memo(
    DataRowImpl,
    (prev, next) =>
        prev.row === next.row &&
        prev.isSelected === next.isSelected &&
        prev.isActive === next.isActive &&
        prev.isTabbable === next.isTabbable &&
        prev.clickable === next.clickable &&
        prev.visibleColumns === next.visibleColumns &&
        prev.stickyKey === next.stickyKey
) as typeof DataRowImpl

// The <tbody> rows for every state: skeleton rows while loading, an error, the data rows, or an empty / "no matches" message.

export const TableBodyRows = React.memo(
    TableBodyRowsImpl,
    (_prev, next) => !!next.frozen
) as typeof TableBodyRowsImpl
