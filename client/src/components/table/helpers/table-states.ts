import * as React from "react"
import { AlertTriangle, Columns3, Inbox, RefreshCw, SearchX, X } from "lucide-react"

import type {
    DataTableStates,
    TableItemName,
    TableStateConfig,
    TableStateContext,
    TableStateKind,
    TableStateOption,
} from "../types/states"

/** A state ready to render: either a config for <TableStateView /> or your own node */
export type ResolvedTableState =
    | { kind: TableStateKind; config: TableStateConfig; compact?: boolean; node?: undefined }
    | { kind: TableStateKind; node: React.ReactElement; config?: undefined; compact?: undefined }

const DEFAULT_ITEM_NAME: TableItemName = { singular: "item", plural: "items" }

/** "1 filter" / "3 filters" */
const filtersText = (count: number) => `${count} filter${count === 1 ? "" : "s"}`

/** Which state applies, or null when there are rows to show */
export function getTableStateKind({
    isLoading,
    hasError,
    rowCount,
    isFiltered,
    visibleDataColumnCount,
}: {
    isLoading: boolean
    hasError: boolean
    rowCount: number
    isFiltered: boolean
    visibleDataColumnCount: number
}): TableStateKind | null {
    if (isLoading) return null
    if (hasError) return "error"
    if (rowCount === 0) return isFiltered ? "noResults" : "empty"
    if (visibleDataColumnCount === 0) return "noColumns"
    return null
}

export interface TableStateHandlers {
    clearSearch: () => void
    clearFilters: () => void
    retry?: () => void
    isRetrying?: boolean
    refresh?: () => void
    showAllColumns: () => void
}

/** The built-in texts and buttons for each state */
function defaultConfig(
    kind: TableStateKind,
    { singular, plural }: TableItemName,
    context: Omit<TableStateContext, "defaults">,
    handlers: TableStateHandlers
): TableStateConfig {
    const { search, filterCount, errorMessage } = context
    switch (kind) {
        case "empty":
            return {
                icon: Inbox,
                title: `No ${plural} yet`,
                description: `When ${plural} are added, they’ll show up here.`,
                actions: handlers.refresh
                    ? [{ label: "Refresh", icon: RefreshCw, onClick: handlers.refresh, variant: "outline" }]
                    : [],
            }
        case "noResults": {
            const quoted = search ? `“${search}”` : ""
            const description =
                search && filterCount
                    ? `Nothing matches ${quoted} with ${filtersText(filterCount)} applied. Try another search or remove a filter.`
                    : search
                      ? `Nothing matches ${quoted}. Check the spelling or try a different word.`
                      : `No ${plural} match the ${filtersText(filterCount)} applied. Try removing one.`
            return {
                icon: SearchX,
                title: `No matching ${plural}`,
                description,
                actions: [
                    ...(search ? [{ label: "Clear search", icon: X, onClick: handlers.clearSearch }] : []),
                    ...(filterCount ? [{ label: filterCount > 1 ? "Clear filters" : "Clear filter", icon: X, onClick: handlers.clearFilters }] : []),
                ],
            }
        }
        case "error":
            return {
                icon: AlertTriangle,
                tone: "destructive",
                title: `Couldn’t load ${plural}`,
                description: errorMessage,
                actions: handlers.retry
                    ? [
                          {
                              label: handlers.isRetrying ? "Retrying…" : "Try again",
                              icon: RefreshCw,
                              onClick: handlers.retry,
                              loading: handlers.isRetrying,
                          },
                      ]
                    : [],
            }
        case "noColumns":
            return {
                icon: Columns3,
                title: "All columns are hidden",
                description: `Turn columns back on to see your ${plural === "items" ? "data" : plural}.`,
                actions: [{ label: "Show all columns", onClick: handlers.showAllColumns }],
            }
    }
    // Unreachable with a valid kind; keeps TypeScript satisfied if a kind is added later
    return { title: singular }
}

/**
 * Builds what to show for a state: the default, with the table's `states` option for it
 * applied on top (a partial config, a function, your own node, or false for a plain line).
 */
export function resolveTableState({
    kind,
    states,
    itemName = DEFAULT_ITEM_NAME,
    search,
    filterCount,
    errorMessage,
    handlers,
}: {
    kind: TableStateKind
    states?: DataTableStates
    itemName?: TableItemName
    search: string
    filterCount: number
    errorMessage?: string
    handlers: TableStateHandlers
}): ResolvedTableState {
    const context = { search, filterCount, errorMessage }
    const defaults = defaultConfig(kind, itemName, context, handlers)
    const option: TableStateOption | undefined = states?.[kind]

    if (option === undefined) return { kind, config: defaults }
    if (option === false) return { kind, config: { title: defaults.title }, compact: true }
    if (React.isValidElement(option)) return { kind, node: option }

    const custom = typeof option === "function" ? option({ ...context, defaults }) : option
    return { kind, config: { ...defaults, ...custom } }
}

/** "candidate" → { singular: "candidate", plural: "candidates" } */
export function toItemName(name: string | TableItemName | undefined): TableItemName | undefined {
    if (!name) return undefined
    return typeof name === "string" ? { singular: name, plural: `${name}s` } : name
}
