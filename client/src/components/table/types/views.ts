import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

/** Everything a saved view restores */
export interface ViewState {
    search: string
    columnFilters: ColumnFiltersState
    sorting: SortingState
    /** Order of the movable (non-pinned) columns */
    order: string[]
    visibility: Record<string, boolean>
    sizing: Record<string, number>
}

export interface SavedView extends ViewState {
    id: string
    name: string
    updatedAt: number
}

export interface ViewContext {
    /** Every column id in the table */
    columnIds: string[]
    /** Turns a saved order into the full order (drops removed columns, appends new ones) */
    resolveOrder: (order: string[]) => string[]
}

/** Layout preferences remembered in localStorage under `persistKey` */
export interface TableSettings {
    order?: string[]
    visibility?: Record<string, boolean>
    sorting?: SortingState
    sizing?: Record<string, number>
    pageSize?: number
    activeViewId?: string | null
    /** Viewer's choice from the Columns dialog; undefined = the table's default */
    headerIcons?: boolean
}
