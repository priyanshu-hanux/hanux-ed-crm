import * as React from "react"
import type { ColumnFiltersState, ColumnSizingState, ColumnVisibilityState, SortingState } from "@tanstack/react-table"

import { saveTableSettings } from "../helpers/storage"
import { writeFiltersToUrl } from "../helpers/url-state"
import type { ColumnFilterConfig } from "../types/column"

/**
 * Keeps the table's state outside the component:
 * layout preferences in localStorage (when persistKey is set),
 * search and filters in the URL (when syncUrl is on).
 */
export function useTablePersistence({
    persistKey,
    movableOrder,
    columnVisibility,
    sorting,
    columnSizing,
    pageSize,
    activeViewId,
    headerIcons,
    syncUrl,
    urlPrefix,
    columnFilters,
    globalFilter,
    filterConfigs,
}: {
    persistKey?: string
    movableOrder: string[]
    columnVisibility: ColumnVisibilityState
    sorting: SortingState
    columnSizing: ColumnSizingState
    /** undefined in server mode: the parent owns the page size there */
    pageSize: number | undefined
    activeViewId: string | null
    /** undefined = the viewer hasn't changed it, so don't store it */
    headerIcons: boolean | undefined
    syncUrl: boolean
    urlPrefix: string
    columnFilters: ColumnFiltersState
    globalFilter: string
    filterConfigs: Map<string, ColumnFilterConfig>
}) {
    // Save layout preferences whenever they change
    React.useEffect(() => {
        if (!persistKey) return
        saveTableSettings(persistKey, {
            order: movableOrder,
            visibility: columnVisibility,
            sorting,
            sizing: columnSizing,
            pageSize,
            activeViewId,
            headerIcons,
        })
    }, [persistKey, movableOrder, columnVisibility, sorting, columnSizing, pageSize, activeViewId, headerIcons])

    // Mirror the applied search and filters into the URL
    React.useEffect(() => {
        if (syncUrl) writeFiltersToUrl(columnFilters, globalFilter, filterConfigs, urlPrefix)
    }, [syncUrl, columnFilters, globalFilter, filterConfigs, urlPrefix])
}
