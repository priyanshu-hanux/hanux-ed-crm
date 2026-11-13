import * as React from "react"
import type { ColumnFiltersState, ColumnSizingState, ColumnVisibilityState, SortingState, Updater } from "@tanstack/react-table"
import { toast } from "sonner"

import type { ColumnFilterConfig } from "../types/column"
import type { SavedView, ViewState } from "../types/views"
import { saveViews } from "../helpers/storage"
import { createDefaultViewState, createViewId, viewStateKey } from "../helpers/views"

/**
 * Saved views: named setups of search, filters, sorting and column layout.
 * Compares the current setup with the active view (isModified), applies views,
 * and keeps the list in localStorage.
 */
export function useSavedViews({
    persistKey,
    views,
    setViews,
    activeViewId,
    setActiveViewId,
    current,
    columnOrder,
    resolveOrder,
    defaultVisibility,
    filterConfigs,
    setColumnFilters,
    setSearch,
    setSorting,
    setMovableOrder,
    setColumnSizing,
    setColumnVisibility,
}: {
    persistKey?: string
    views: SavedView[]
    setViews: React.Dispatch<React.SetStateAction<SavedView[]>>
    activeViewId: string | null
    setActiveViewId: (id: string | null) => void
    /** The table's current setup */
    current: ViewState
    /** Every column id, in the current order */
    columnOrder: string[]
    resolveOrder: (order: string[]) => string[]
    defaultVisibility: ColumnVisibilityState
    filterConfigs: Map<string, ColumnFilterConfig>
    setColumnFilters: (filters: ColumnFiltersState) => void
    /** Sets the search input and the applied search at once */
    setSearch: (search: string) => void
    setSorting: (sorting: SortingState) => void
    setMovableOrder: (order: string[]) => void
    setColumnSizing: (sizing: ColumnSizingState) => void
    setColumnVisibility: (visibility: Updater<ColumnVisibilityState>) => void
}) {
    const defaultViewState = createDefaultViewState(defaultVisibility)
    const viewContext = { columnIds: columnOrder, resolveOrder }
    const activeView = views.find((view) => view.id === activeViewId)
    const isModified =
        viewStateKey(current, viewContext) !== viewStateKey(activeView ?? defaultViewState, viewContext)

    const applyViewState = (state: ViewState) => {
        // Skip anything that refers to columns that no longer exist
        const knownColumnIds = new Set(columnOrder)
        setColumnFilters(state.columnFilters.filter((filter) => filterConfigs.has(filter.id)))
        setSearch(state.search)
        setSorting(state.sorting.filter((sort) => knownColumnIds.has(sort.id)))
        setMovableOrder(state.order)
        setColumnSizing(state.sizing)
        setColumnVisibility({ ...defaultVisibility, ...state.visibility })
    }

    const selectView = (viewId: string | null) => {
        const view = views.find((v) => v.id === viewId)
        applyViewState(view ?? defaultViewState)
        setActiveViewId(view ? view.id : null)
    }

    const saveNewView = (name: string) => {
        const view: SavedView = { id: createViewId(), name, updatedAt: Date.now(), ...current }
        setViews((prev) => [...prev, view])
        setActiveViewId(view.id)
        toast.success(`Saved view “${name}”`)
    }

    const updateActiveView = () => {
        if (!activeView) return
        setViews((prev) =>
            prev.map((view) => (view.id === activeView.id ? { ...view, ...current, updatedAt: Date.now() } : view))
        )
        toast.success(`Updated “${activeView.name}”`)
    }

    const renameActiveView = (name: string) => {
        setViews((prev) => prev.map((view) => (view.id === activeViewId ? { ...view, name } : view)))
    }

    const deleteActiveView = () => {
        const index = views.findIndex((view) => view.id === activeViewId)
        const view = views[index]
        if (!view) return
        setViews((prev) => prev.filter((v) => v.id !== view.id))
        setActiveViewId(null) // the table keeps its current setup, now compared to the default
        toast(`Deleted view “${view.name}”`, {
            action: {
                label: "Undo",
                onClick: () => {
                    setViews((prev) => {
                        const next = [...prev]
                        next.splice(Math.min(index, next.length), 0, view)
                        return next
                    })
                    setActiveViewId(view.id)
                },
            },
        })
    }

    // Save the list whenever it changes
    React.useEffect(() => {
        if (persistKey) saveViews(persistKey, views)
    }, [persistKey, views])

    return { activeView, isModified, selectView, saveNewView, updateActiveView, renameActiveView, deleteActiveView }
}
