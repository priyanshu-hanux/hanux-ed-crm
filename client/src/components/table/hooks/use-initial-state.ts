import * as React from "react"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

import { filterConfigsOf, getColumnId } from "../helpers/columns"
import { loadTableSettings, loadViews } from "../helpers/storage"
import { readFiltersFromUrl } from "../helpers/url-state"
import type { SavedView } from "../types/views"

/**
 * Everything the table starts from, read once before the first render:
 * saved layout (localStorage), saved views, and search/filters from the URL.
 * A shared link with filters wins over the active view's filters.
 */
export function useInitialState({
    columns,
    persistKey,
    syncUrl,
    urlPrefix,
}: {
    columns: readonly unknown[]
    persistKey?: string
    syncUrl: boolean
    urlPrefix: string
}) {
    const filterConfigs = React.useMemo(() => filterConfigsOf(columns), [columns])

    const [stored] = React.useState(() => (persistKey ? loadTableSettings(persistKey) : null))
    const [urlState] = React.useState(() => (syncUrl ? readFiltersFromUrl(filterConfigs, urlPrefix) : null))

    const [views, setViews] = React.useState<SavedView[]>(() => (persistKey ? loadViews(persistKey) : []))
    const [activeViewId, setActiveViewId] = React.useState<string | null>(() => {
        const id = stored?.activeViewId ?? null
        return id && views.some((view) => view.id === id) ? id : null
    })

    // Initial values only: later renders ignore them
    const [initial] = React.useState(() => {
        const urlHasFilters = !!urlState && (urlState.columnFilters.length > 0 || !!urlState.search)
        const initialView = views.find((view) => view.id === activeViewId)
        // Drop saved sorts for columns that no longer exist
        const knownIds = new Set(columns.map((column) => getColumnId(column as never)))

        return {
            sorting: (stored?.sorting ?? []).filter((sort) => knownIds.has(sort.id)) as SortingState,
            columnSizing: stored?.sizing ?? {},
            columnFilters: (urlHasFilters
                ? urlState!.columnFilters
                : (initialView?.columnFilters ?? []).filter((filter) => filterConfigs.has(filter.id))) as ColumnFiltersState,
            search: urlHasFilters ? urlState!.search : initialView?.search ?? "",
            order: stored?.order ?? [],
        }
    })

    return { filterConfigs, stored, views, setViews, activeViewId, setActiveViewId, initial }
}
