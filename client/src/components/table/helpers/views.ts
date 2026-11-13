import type { ColumnVisibilityState } from "@tanstack/react-table"

import type { ViewContext, ViewState } from "../types/views"

export function createViewId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** The built-in view: no search, no filters, no sorting, default layout */
export function createDefaultViewState(visibility: ColumnVisibilityState): ViewState {
    return {
        search: "",
        columnFilters: [],
        sorting: [],
        order: [],
        visibility,
        sizing: {},
    }
}

/**
 * A stable text version of a setup: two setups that look the same in the table
 * give the same text, even if they were stored differently
 * (filter order, selected values in a different order, hidden-by-default columns, …).
 */
export function viewStateKey(state: ViewState, context: ViewContext): string {
    const filters = [...state.columnFilters]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(({ id, value }) => [
            id,
            Array.isArray(value) && value.every((v) => typeof v === "string") ? [...value].sort() : value,
        ])

    const hidden = context.columnIds.filter((id) => state.visibility[id] === false).sort()

    const widths = Object.entries(state.sizing)
        .filter(([id]) => context.columnIds.includes(id))
        .map(([id, width]) => [id, Math.round(width)] as const)
        .sort(([a], [b]) => a.localeCompare(b))

    return JSON.stringify({
        q: state.search.trim().toLowerCase(),
        f: filters,
        s: state.sorting,
        o: context.resolveOrder(state.order),
        h: hidden,
        w: widths,
    })
}
