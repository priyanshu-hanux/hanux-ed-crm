import * as React from "react"
import type { Row, RowData } from "@tanstack/react-table"

import { pageOfIndex } from "../helpers/pagination"
import type { DataTableFeatures } from "../types/column"

/**
 * Row keyboard navigation with a roving tab stop: Tab enters the table once, onto a single row.
 *   ↓/↑ (J/K) next/previous row, continuing across pages · Home/End first/last on the page
 *   Page Down/Up one page · Space select · Shift+↓/↑ select while moving · Enter open details
 */
export function useKeyboardNavigation<TData extends RowData>({
    pageRows,
    matchingRows,
    focusedRowId,
    focusRequest,
    requestFocus,
    bodyScrollRef,
    serverSidePagination,
    pageNumber,
    pageSize,
    goToPage,
    selectable,
    canOpenDetails,
    openDetails,
}: {
    /** Rows on the current page */
    pageRows: Row<DataTableFeatures, TData>[]
    /** Filtered + sorted rows, all pages */
    matchingRows: Row<DataTableFeatures, TData>[]
    focusedRowId: string | null
    focusRequest: number
    requestFocus: (rowId: string) => void
    bodyScrollRef: React.RefObject<HTMLDivElement | null>
    serverSidePagination: boolean
    pageNumber: number
    pageSize: number
    goToPage: (page: number) => void
    /** Rows have checkboxes */
    selectable: boolean
    canOpenDetails: boolean
    openDetails: (rowId: string) => void
}) {
    // Only one row is in the tab order: the focused one if it's on this page, else the first
    const rovingRowId =
        focusedRowId && pageRows.some((row) => row.id === focusedRowId) ? focusedRowId : pageRows[0]?.id ?? null
    const pageStartIndex = pageRows[0] ? matchingRows.findIndex((row) => row.id === pageRows[0].id) : -1
    const pageEndIndex = pageStartIndex + pageRows.length - 1

    const focusRowAt = (index: number) => {
        if (matchingRows.length === 0) return
        const clamped = Math.max(0, Math.min(matchingRows.length - 1, index))
        requestFocus(matchingRows[clamped].id)
        // Follow the row onto its page
        if (!serverSidePagination) {
            const page = pageOfIndex(clamped, pageSize)
            if (page !== pageNumber) goToPage(page)
        }
    }

    // Move real focus once the row is rendered (it may be on a page that just loaded)
    React.useEffect(() => {
        if (focusRequest === 0 || !rovingRowId) return
        const element = bodyScrollRef.current?.querySelector<HTMLElement>(
            `tr[data-row-id="${CSS.escape(rovingRowId)}"]`
        )
        element?.focus({ preventScroll: true })
        element?.scrollIntoView({ block: "nearest" })
        // Only when focus is requested, not whenever the roving row changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusRequest])

    /** Focuses the first row on the page; false when there is none */
    const focusFirstRowOnPage = () => {
        if (pageStartIndex < 0) return false
        focusRowAt(pageStartIndex)
        return true
    }

    const handleRowKeyDown = (
        event: React.KeyboardEvent<HTMLTableRowElement>,
        row: Row<DataTableFeatures, TData>
    ) => {
        // Keys pressed on a checkbox, button or menu inside the row keep their own behavior
        if (event.target !== event.currentTarget) return
        const index = matchingRows.findIndex((r) => r.id === row.id)
        const canSelect = selectable && row.getCanSelect()

        switch (event.key) {
            case "ArrowDown":
            case "j": {
                event.preventDefault()
                if (event.shiftKey && canSelect) {
                    row.toggleSelected(true)
                    matchingRows[index + 1]?.toggleSelected(true)
                }
                focusRowAt(index + 1)
                break
            }
            case "ArrowUp":
            case "k": {
                event.preventDefault()
                if (event.shiftKey && canSelect) {
                    row.toggleSelected(true)
                    matchingRows[index - 1]?.toggleSelected(true)
                }
                focusRowAt(index - 1)
                break
            }
            case "Home":
                event.preventDefault()
                focusRowAt(pageStartIndex)
                break
            case "End":
                event.preventDefault()
                focusRowAt(pageEndIndex)
                break
            case "PageDown":
                event.preventDefault()
                focusRowAt(index + pageSize)
                break
            case "PageUp":
                event.preventDefault()
                focusRowAt(index - pageSize)
                break
            case " ":
                if (canSelect) {
                    event.preventDefault() // don't scroll the page
                    row.toggleSelected()
                }
                break
            case "Enter":
                if (canOpenDetails) {
                    event.preventDefault()
                    openDetails(row.id)
                }
                break
        }
    }

    return { rovingRowId, focusFirstRowOnPage, handleRowKeyDown }
}
