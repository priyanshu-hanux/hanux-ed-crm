import * as React from "react"
import type { RowData, Table } from "@tanstack/react-table"

import { sameOffsets } from "../helpers/sticky"
import type { DataTableFeatures, StickySide } from "../types/column"

export interface StickyCell {
    side: StickySide | undefined
    /** Set on the innermost pinned column of each side, which draws the edge shadow */
    edge: StickySide | undefined
    style: React.CSSProperties
}

export type GetSticky = (columnId: string, isHeader?: boolean) => StickyCell

/**
 * Pinned columns (meta.sticky): offsets measured from the rendered header cells,
 * so they stay right when columns are resized, shown or hidden.
 */
export function useStickyColumns<TData extends RowData>({
    table,
    wrapperRef,
}: {
    table: Table<DataTableFeatures, TData>
    wrapperRef: React.RefObject<HTMLDivElement | null>
}) {
    const [stickyOffsets, setStickyOffsets] = React.useState<Record<string, number>>({})

    const visibleLeafColumns = table.getVisibleLeafColumns()
    const visibleColumnsKey = visibleLeafColumns.map((c) => c.id).join("|")
    const leftStickyIds = visibleLeafColumns.filter((c) => c.columnDef.meta?.sticky === "left").map((c) => c.id)
    const rightStickyIds = visibleLeafColumns.filter((c) => c.columnDef.meta?.sticky === "right").map((c) => c.id)
    const lastLeftStickyId = leftStickyIds[leftStickyIds.length - 1]
    const firstRightStickyId = rightStickyIds[0]

    React.useLayoutEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return

        const ids = visibleColumnsKey ? visibleColumnsKey.split("|") : []
        const stickyOf = (id: string) => table.getColumn(id)?.columnDef.meta?.sticky
        const widthOf = (id: string) =>
            wrapper.querySelector<HTMLElement>(`thead th[data-column-id="${CSS.escape(id)}"]`)?.offsetWidth ?? 0

        const measure = () => {
            const next: Record<string, number> = {}

            let left = 0
            for (const id of ids.filter((id) => stickyOf(id) === "left")) {
                next[id] = left
                left += widthOf(id)
            }

            let right = 0
            for (const id of ids.filter((id) => stickyOf(id) === "right").reverse()) {
                next[id] = right
                right += widthOf(id)
            }

            setStickyOffsets((prev) => (sameOffsets(prev, next) ? prev : next))
        }

        measure()
        const observer = new ResizeObserver(measure)
        wrapper.querySelectorAll("thead th").forEach((th) => observer.observe(th))
        return () => observer.disconnect()
        // Re-measure when the visible columns change; widths are tracked by the observer
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleColumnsKey])

    const getSticky: GetSticky = (columnId, isHeader = false) => {
        const side = table.getColumn(columnId)?.columnDef.meta?.sticky
        if (!side) return { side: undefined, edge: undefined, style: {} }

        const isEdge = columnId === lastLeftStickyId || columnId === firstRightStickyId
        const offset = stickyOffsets[columnId] ?? 0

        return {
            side,
            edge: isEdge ? side : undefined,
            style: {
                position: "sticky",
                [side]: isHeader && side === "right"
                    ? `calc(${offset}px + var(--dt-gutter, 0px))`
                    : offset,
                zIndex: isHeader ? 3 : 2,
            } as React.CSSProperties,
        }
    }

    return { visibleLeafColumns, visibleColumnsKey, getSticky, stickyOffsets }
}
