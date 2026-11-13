import type { RowSelectionState } from "@tanstack/react-table"

import { pageOfIndex } from "./pagination"

interface SelectableRow {
    getIsSelected: () => boolean
}

export interface SelectionSummary {
    /** Every selected row id, including rows the filters hide */
    totalSelected: number
    /** page → number of selected rows on it */
    selectedByPage: Map<number, number>
    selectedOnThisPage: number
    /** Other pages that hold selected rows, ascending */
    otherSelectedPages: number[]
    /** Selected rows the current filters hide: kept, but left out of bulk actions */
    hiddenSelectedCount: number
    /** Offer "Select all N" once the whole page is ticked and more matching rows exist */
    canSelectAllMatching: boolean
}

/** Where the selection is: which pages hold selected rows, and how many are hidden by filters */
export function getSelectionSummary({
    matchingRows,
    rowSelection,
    selectedRowCount,
    pageNumber,
    pageSize,
    serverSidePagination,
    isAllPageRowsSelected,
}: {
    /** Filtered + sorted rows, all pages */
    matchingRows: SelectableRow[]
    rowSelection: RowSelectionState
    /** Selected rows visible under the current filters */
    selectedRowCount: number
    pageNumber: number
    pageSize: number
    serverSidePagination: boolean
    isAllPageRowsSelected: boolean
}): SelectionSummary {
    const totalSelected = Object.keys(rowSelection).length

    const selectedByPage = new Map<number, number>()
    matchingRows.forEach((row, index) => {
        if (!row.getIsSelected()) return
        const page = serverSidePagination ? pageNumber : pageOfIndex(index, pageSize)
        selectedByPage.set(page, (selectedByPage.get(page) ?? 0) + 1)
    })

    return {
        totalSelected,
        selectedByPage,
        selectedOnThisPage: selectedByPage.get(pageNumber) ?? 0,
        otherSelectedPages: [...selectedByPage.keys()].filter((page) => page !== pageNumber).sort((a, b) => a - b),
        hiddenSelectedCount: totalSelected - selectedRowCount,
        canSelectAllMatching:
            !serverSidePagination && isAllPageRowsSelected && selectedRowCount < matchingRows.length,
    }
}
