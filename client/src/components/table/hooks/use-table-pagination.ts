import type { RowData, Table } from "@tanstack/react-table"

import type { DataTableFeatures } from "../types/column"

export interface TablePagination {
    /** 1-based */
    pageNumber: number
    pageCount: number
    pageSize: number
    totalCount: number
    canPreviousPage: boolean
    canNextPage: boolean
    /** Server-side without onPageChange can only step back/forward, so numbers aren't clickable */
    canJumpToPage: boolean
    /** Server-side needs a callback to change the size; client-side handles it itself */
    canChangePageSize: boolean
    /** "Showing 11–12 of 12" */
    rangeStart: number
    rangeEnd: number
    /** Rows-per-page choices, including the current size even if it's not in the list */
    sizeChoices: number[]
    goToPage: (page: number) => void
    changePageSize: (size: number) => void
}

/**
 * One view of pagination for both modes: client-side (the table pages the rows itself)
 * and server-side (the parent passes the page, the count and the callbacks).
 */
export function useTablePagination<TData extends RowData>({
    table,
    clientPagination,
    serverSidePagination,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    pageSizeOptions,
    onPageChange,
    onPreviousPage,
    onNextPage,
    onPageSizeChange,
}: {
    table: Table<DataTableFeatures, TData>
    /** The table's own pagination state (used in client mode) */
    clientPagination: { pageIndex: number; pageSize: number }
    serverSidePagination: boolean
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
    pageSizeOptions: number[]
    onPageChange?: (page: number) => void
    onPreviousPage?: () => void
    onNextPage?: () => void
    onPageSizeChange?: (pageSize: number) => void
}): TablePagination {
    const pageNumber = serverSidePagination
        ? currentPage
        : clientPagination.pageIndex + 1
    const pageCount = serverSidePagination
        ? Math.max(1, totalPages)
        : Math.max(1, table.getPageCount())
    const currentPageSize = serverSidePagination
        ? pageSize
        : clientPagination.pageSize
    const totalCount = serverSidePagination
        ? totalItems
        : table.getFilteredRowModel().rows.length

    const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * currentPageSize + 1
    const rangeEnd = Math.min(pageNumber * currentPageSize, totalCount)

    const sizeChoices = pageSizeOptions.includes(currentPageSize)
        ? pageSizeOptions
        : [...pageSizeOptions, currentPageSize].sort((a, b) => a - b)

    const goToPage = (page: number) => {
        if (page < 1 || page > pageCount || page === pageNumber) return
        if (!serverSidePagination) {
            table.setPageIndex(page - 1)
        } else if (onPageChange) {
            onPageChange(page)
        } else if (page === pageNumber - 1) {
            onPreviousPage?.()
        } else if (page === pageNumber + 1) {
            onNextPage?.()
        }
    }

    const changePageSize = (size: number) => {
        if (size === currentPageSize) return
        if (serverSidePagination) {
            onPageSizeChange?.(size)
            return
        }
        // Stay on the page that contains the row currently at the top,
        // instead of jumping back to page 1
        const firstRowIndex = (pageNumber - 1) * currentPageSize
        table.setPagination({ pageIndex: Math.floor(firstRowIndex / size), pageSize: size })
    }

    return {
        pageNumber,
        pageCount,
        pageSize: currentPageSize,
        totalCount,
        canPreviousPage: pageNumber > 1,
        canNextPage: pageNumber < pageCount,
        canJumpToPage: !serverSidePagination || !!onPageChange,
        canChangePageSize: !serverSidePagination || !!onPageSizeChange,
        rangeStart,
        rangeEnd,
        sizeChoices,
        goToPage,
        changePageSize,
    }
}
