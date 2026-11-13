import type * as React from "react"
import type { ColumnVisibilityState, RowData } from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"

import type { ColumnDef } from "./column"
import type { DataTableBulkAction, DataTableSelectionPreset } from "./bulk-actions"
import type { DataTableFiltersState } from "./filters"
import type { DataTableStates, TableItemName } from "./states"
import type { DataTableToolbarAction } from "./toolbar"

export interface DataTableAction<TData extends RowData> {
    label: string
    icon?: LucideIcon
    onClick: (row: TData) => void
    variant?: "default" | "destructive" | "secondary" | "ghost" | "link" | "outline"
    show?: (row: TData) => boolean
}

/** Which row fields the mobile card layout shows */
/** A row property, or a function for values that need working out (e.g. the current job title) */
export type DataTableCardField<TData> = keyof TData | ((row: TData) => React.ReactNode)

export interface DataTableCardFields<TData> {
    title: DataTableCardField<TData>
    subtitle?: DataTableCardField<TData>
    description?: DataTableCardField<TData>
    badge?: DataTableCardField<TData>
    /** Image URL property */
    image?: keyof TData
}

export interface DataTableProps<TData extends RowData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    title?: string
    description?: string
    icon?: LucideIcon
    searchKey?: string
    searchPlaceholder?: string
    /** Columns the toolbar search looks in. Default: [searchKey] */
    searchColumns?: string[]
    /** "client": filter the loaded rows. "server": hand filters to onFiltersChange.
     *  Default: "server" with serverSidePagination, otherwise "client" */
    filterMode?: "client" | "server"
    /** Server mode: called with the current filters (debounced for search). Reset your page to 1 here. */
    onFiltersChange?: (filters: DataTableFiltersState) => void

    /** Remember column order, visibility, sorting and rows per page in localStorage under this key */
    persistKey?: string
    /** Keep search and filters in the URL, so filtered views can be bookmarked and shared */
    syncUrl?: boolean
    /** Prefix for URL params when one page has several synced tables, e.g. "c" → ?c.company=TCS */
    urlPrefix?: string

    actions?: DataTableAction<TData>[]
    onRowSelect?: (selectedRows: TData[]) => void
    /**
     * Operations on the selected rows, shown in the selection bar (delete, assign, change status…).
     * The table shows them and calls onRun(rows); the work itself is yours. Turns on row checkboxes.
     * Example: { id: "assign", label: "Assign to", options: executives, onRun: (rows, { option }) => … }
     */
    bulkActions?: DataTableBulkAction<TData>[]
    /**
     * Quick selections in the toolbar's Select menu, e.g. { id: "no-email", label: "Missing email",
     * match: (row) => !row.email }. They look at rows matching the search and filters, on every page.
     */
    selectionPresets?: DataTableSelectionPreset<TData>[]
    /** List presets that match no rows too (disabled) instead of hiding them. Default: false */
    showEmptySelectionPresets?: boolean
    /**
     * Your own toolbar buttons. They go into the "More" (⋯) menu unless placement is "toolbar",
     * so new features don't crowd the toolbar. Example: { id: "import", label: "Import CSV", onSelect }
     */
    toolbarActions?: DataTableToolbarAction[]
    columnVisibility?: ColumnVisibilityState
    onColumnVisibilityChange?: (visibility: ColumnVisibilityState) => void
    /** Starting visibility (e.g. { skills: false }) and what "Reset to default" returns to. Saved choices win. */
    defaultColumnVisibility?: ColumnVisibilityState
    selectedItems?: TData[]
    onBulkDelete?: () => void
    onRefresh?: () => void
    isRefreshing?: boolean

    /** First load: shows skeleton rows while there's no data yet */
    isLoading?: boolean
    /** Loading failed. With no rows: an error state in the table. With rows (a failed refresh): a banner above it. */
    error?: unknown
    /** Called by the retry buttons. Default: onRefresh */
    onRetry?: () => void
    /**
     * What the table shows when it has no rows: "empty" (no data), "noResults" (search/filters
     * match nothing), "error" (load failed), "noColumns" (all hidden). Each can be a partial config
     * merged over the default, a function of the search/filters/error, your own element, or false.
     * Example: states={{ empty: { title: "No candidates yet", actions: [{ label: "Add", onClick }] } }}
     */
    states?: DataTableStates
    /** Name of the rows for the default texts: "candidate" → "No candidates yet". Default: "item" */
    itemName?: string | TableItemName
    /** Older way to set the "empty" state (text or an element). Prefer `states.empty`. */
    emptyState?: React.ReactNode
    /** Number of skeleton rows. Default: the page size, up to 10 */
    skeletonRows?: number

    /** Stable id per row. Defaults to `row.id` when present, otherwise the row index. */
    getRowId?: (row: TData, index: number) => string
    cardFields?: DataTableCardFields<TData>

    /** Keep the toolbar pinned to the top while the page scrolls. Default: true */
    stickyToolbar?: boolean
    /** Keep the column header pinned (below the toolbar, if that's sticky too). Default: true */
    stickyHeader?: boolean
    /** Distance in px from the top of the scroll container, e.g. the height of a fixed app header. Default: 0 */
    stickyOffset?: number
    /** Draw vertical borders between cells. Default: false */
    cellBorders?: boolean
    /** Show each column's `meta.icon` in the header. Viewers can switch this in the Columns dialog. Default: true */
    showHeaderIcons?: boolean
    /** Max height of the body; rows scroll inside it. Default: none (page scrolls) */
    maxBodyHeight?: number | string

    /** Choices in the rows-per-page select. Default: [10, 25, 50, 100] */
    pageSizeOptions?: number[]
    /** Server-side: called with the new page size. Enables the rows-per-page select in that mode. */
    onPageSizeChange?: (pageSize: number) => void

    // Server-side pagination props
    serverSidePagination?: boolean
    currentPage?: number
    totalPages?: number
    totalItems?: number
    pageSize?: number
    onPreviousPage?: () => void
    onNextPage?: () => void
    /** Jump to a specific page (1-based). Enables the numbered page links in server-side mode. */
    onPageChange?: (page: number) => void

    /**
     * Show "Export to CSV" in the toolbar's ⋯ menu: every row matching the search and filters, all pages.
     * (Selected rows are exported from the selection toolbar with a bulk action calling exportCsv().) Default: true
     */
    enableExport?: boolean
    /** Base of the export file name. Default: title, or "export" */
    exportFilename?: string
    /** Server mode: export all matching rows through your API (e.g. a download endpoint) */
    onExportAll?: () => void

    /** Content of the details drawer. Providing it makes rows clickable. */
    renderDetails?: (row: TData) => React.ReactNode
    /** Drawer title, e.g. the candidate's name. Default: "Details" */
    getDetailsTitle?: (row: TData) => React.ReactNode
    /** Line under the title, e.g. role and company */
    getDetailsDescription?: (row: TData) => React.ReactNode
    /** Control which row's drawer is open (row id), e.g. to open it from a "View" action */
    detailsRowId?: string | null
    onDetailsRowIdChange?: (rowId: string | null) => void

    /** Show the Views menu. Default: on when persistKey is set */
    enableViews?: boolean
    /** Name of the built-in view without filters. Default: "All " + title */
    defaultViewName?: string

    /** Keyboard shortcuts: / for search, ? for help. Default: true */
    enableKeyboardShortcuts?: boolean
}
