import * as React from "react"
import type { Row, RowData } from "@tanstack/react-table"

import { INTERACTIVE_SELECTOR } from "../config/constants"
import { pageOfIndex } from "../helpers/pagination"
import type { DataTableFeatures } from "../types/column"

/**
 * The details drawer: which row is open (controlled through detailsRowId, or internal),
 * stepping through the matching rows (following them across pages), and opening it on row click.
 */
export function useDetailsDrawer<TData extends RowData>({
    detailsRowId: controlledRowId,
    onDetailsRowIdChange,
    enabled,
    matchingRows,
    isLoading,
    bodyScrollRef,
    serverSidePagination,
    pageNumber,
    pageSize,
    goToPage,
    setFocusedRowId,
    requestFocus,
}: {
    detailsRowId?: string | null
    onDetailsRowIdChange?: (rowId: string | null) => void
    /** Rows open the drawer (renderDetails is set) */
    enabled: boolean
    /** Filtered + sorted rows, all pages */
    matchingRows: Row<DataTableFeatures, TData>[]
    isLoading: boolean
    bodyScrollRef: React.RefObject<HTMLDivElement | null>
    serverSidePagination: boolean
    pageNumber: number
    pageSize: number
    goToPage: (page: number) => void
    setFocusedRowId: (rowId: string | null) => void
    requestFocus: (rowId: string) => void
}) {
    // Controlled when the parent passes detailsRowId, otherwise internal
    const [internalRowId, setInternalRowId] = React.useState<string | null>(null)
    const detailsRowId = controlledRowId !== undefined ? controlledRowId : internalRowId
    const setDetailsRowId = onDetailsRowIdChange ?? setInternalRowId

    const detailsIndex = detailsRowId ? matchingRows.findIndex((row) => row.id === detailsRowId) : -1
    const detailsRow = detailsIndex >= 0 ? matchingRows[detailsIndex] : undefined

    // The row whose drawer was open last, so focus can return to it when the drawer closes
    const lastDetailsRowIdRef = React.useRef<string | null>(null)

    // The open row was deleted or filtered out: close the drawer
    React.useEffect(() => {
        if (detailsRowId && !detailsRow && !isLoading) setDetailsRowId(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailsRowId, detailsRow, isLoading])

    // Keep the active row in view while stepping through rows
    React.useEffect(() => {
        if (!detailsRowId) return
        bodyScrollRef.current
            ?.querySelector<HTMLElement>(`tr[data-row-id="${CSS.escape(detailsRowId)}"]`)
            ?.scrollIntoView({ block: "nearest" })
    }, [detailsRowId, pageNumber, bodyScrollRef])

    React.useEffect(() => {
        if (detailsRowId) lastDetailsRowIdRef.current = detailsRowId
    }, [detailsRowId])

    const stepDetails = (delta: number) => {
        const nextIndex = detailsIndex + delta
        const next = matchingRows[nextIndex]
        if (!next) return
        setDetailsRowId(next.id)
        setFocusedRowId(next.id) // closing the drawer returns focus here

        // Follow the row onto its page
        if (!serverSidePagination) {
            const page = pageOfIndex(nextIndex, pageSize)
            if (page !== pageNumber) goToPage(page)
        }
    }

    const handleRowClick = (event: React.MouseEvent, rowId: string) => {
        if (!enabled) return
        if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return
        // The user was selecting text, not clicking
        if (window.getSelection()?.toString()) return
        setDetailsRowId(rowId)
    }

    // Radix would focus <body> (the drawer had no trigger button); go back to the row instead
    const handleCloseAutoFocus = (event: Event) => {
        const rowId = lastDetailsRowIdRef.current
        if (!rowId) return
        event.preventDefault()
        requestFocus(rowId)
    }

    return {
        detailsRowId,
        setDetailsRowId,
        detailsIndex,
        detailsRow,
        stepDetails,
        handleRowClick,
        handleCloseAutoFocus,
    }
}
