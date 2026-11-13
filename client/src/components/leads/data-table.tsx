// import * as React from "react"
// import { columnResizingFeature, columnFacetingFeature, createFacetedMinMaxValues, createFacetedRowModel, createFacetedUniqueValues, globalFilteringFeature, columnOrderingFeature, columnFilteringFeature, columnSizingFeature, columnVisibilityFeature, createFilteredRowModel, createPaginatedRowModel, createSortedRowModel, filterFn_includesString, flexRender, metaHelper, rowPaginationFeature, rowSelectionFeature, rowSortingFeature, sortFn_alphanumeric, sortFn_basic, sortFn_datetime, sortFn_text, tableFeatures, useTable } from "@tanstack/react-table"
// import type { ColumnSizingState, Column, ColumnDef as TanstackColumnDef, ColumnFiltersState, ColumnVisibilityState, PaginationState, Row, RowData, RowSelectionState, SortingState } from "@tanstack/react-table"
// import { Keyboard, ChevronDown, ChevronUp, AlertCircle, Check, X, Copy, MoreHorizontal, Search, Eye, Trash2, RefreshCw, type LucideIcon } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { toast } from "sonner"
// import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
// import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
// import { Input } from "@/components/ui/input"
// import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
// import { TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
// import { Field, FieldLabel } from "@/components/ui/field"
// import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
// import {
//     Select,
//     SelectContent,
//     SelectGroup,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { appIcons } from "@/configs/icons"
// import { ColumnSettingsDialog } from "@/components/leads/table/column-settings-dialog";
// import { createGlobalSearchFn, numberRange, selectAnyOf, textContains } from "@/components/leads/table/filter-fns";
// import { DataTableFilters, type FilterView } from "@/components/leads/table/data-table-filters";
// import { ActiveFilterChips } from "@/components/leads/table/active-filter-chips";
// import { filterConfigsOf, getColumnId, loadTableSettings, readFiltersFromUrl, saveTableSettings, writeFiltersToUrl } from "@/components/leads/table/table-persistence";
// import { DataTableExport } from "@/components/leads/table/data-table-export";
// import { DataTableViews } from "@/components/leads/table/data-table-views";
// import { createViewId, loadViews, saveViews, viewStateKey, type SavedView, type ViewState } from "@/components/leads/table/views";
// import { KeyboardShortcutsDialog } from "@/components/leads/table/keyboard-shortcuts-dialog";

// export const dataTableFeatures = tableFeatures({
//     columnOrderingFeature,
//     rowSelectionFeature,
//     columnVisibilityFeature,
//     columnSizingFeature,
//     columnFilteringFeature,
//     globalFilteringFeature,
//     columnFacetingFeature,
//     columnResizingFeature,

//     filteredRowModel: createFilteredRowModel(),
//     facetedRowModel: createFacetedRowModel(),
//     facetedUniqueValues: createFacetedUniqueValues(),
//     facetedMinMaxValues: createFacetedMinMaxValues(),
//     filterFns: {
//         includesString: filterFn_includesString,
//         textContains,
//         selectAnyOf,
//         numberRange,
//     },
//     rowSortingFeature,
//     sortedRowModel: createSortedRowModel(),
//     sortFns: {
//         alphanumeric: sortFn_alphanumeric,
//         basic: sortFn_basic,
//         datetime: sortFn_datetime,
//         text: sortFn_text,
//     },
//     rowPaginationFeature,
//     paginatedRowModel: createPaginatedRowModel(),
//     columnMeta: metaHelper<{
//         displayName?: string;
//         sticky?: "left" | "right";
//         copyable?: boolean | CopyableConfig;
//         filter?: ColumnFilterConfig;
//         /** Placeholder shape while loading. Default: "text" */
//         skeleton?: "text" | "avatar" | "badge" | "none";
//         /** Value written to CSV. Default: the column's value. Use when the cell value isn't readable text. */
//         exportValue?: (row: unknown) => unknown;
//         /** false = leave this column out of exports. Default: true */
//         exportable?: boolean;
//     }>(),
// })

// export interface CopyableConfig {
//     /** Text to put on the clipboard. Defaults to the cell's value. Return null/"" to hide the button for that row. */
//     getText?: (row: unknown) => string | null | undefined
//     /** Used in the button's label and messages, e.g. "phone number". Defaults to the column's displayName. */
//     label?: string
// }

// export interface FilterOption {
//     value: string
//     label?: string
//     icon?: LucideIcon
// }

// export type ColumnFilterConfig =
//     | { type: "text"; placeholder?: string }
//     | {
//         type: "select"
//         /** true = "is any of" (several values), false = "is" (one value). Default: false */
//         multiple?: boolean
//         /** Fixed choices. Leave out to build them from the data, with counts. */
//         options?: FilterOption[]
//     }
//     | { type: "range"; min?: number; max?: number; step?: number; unit?: string }

// const FILTER_FN_BY_TYPE = {
//     text: "textContains",
//     select: "selectAnyOf",
//     range: "numberRange",
// } as const

// export type DataTableFeatures = typeof dataTableFeatures

// export type ColumnDef<TData extends RowData, TValue = unknown> = TanstackColumnDef<DataTableFeatures, TData, TValue>
// export interface DataTableAction<TData extends RowData> {
//     label: string
//     icon?: LucideIcon
//     onClick: (row: TData) => void
//     variant?: "default" | "destructive" | "secondary" | "ghost" | "link" | "outline"
//     show?: (row: TData) => boolean
// }

// interface DataTableProps<TData extends RowData, TValue> {
//     columns: ColumnDef<TData, TValue>[]
//     data: TData[]
//     title?: string
//     description?: string
//     icon?: LucideIcon
//     searchKey?: string
//     searchPlaceholder?: string
//     /** Columns the toolbar search looks in. Default: [searchKey] */
//     searchColumns?: string[]
//     /** "client": filter the loaded rows. "server": hand filters to onFiltersChange.
//      *  Default: "server" with serverSidePagination, otherwise "client" */
//     filterMode?: "client" | "server"
//     /** Server mode: called with the current filters (debounced for search). Reset your page to 1 here. */
//     onFiltersChange?: (filters: { columnFilters: ColumnFiltersState; globalFilter: string }) => void

//     /** Remember column order, visibility, sorting and rows per page in localStorage under this key */
//     persistKey?: string
//     /** Keep search and filters in the URL, so filtered views can be bookmarked and shared */
//     syncUrl?: boolean
//     /** Prefix for URL params when one page has several synced tables, e.g. "c" → ?c.company=TCS */
//     urlPrefix?: string

//     actions?: DataTableAction<TData>[]
//     onRowSelect?: (selectedRows: TData[]) => void
//     columnVisibility?: ColumnVisibilityState
//     onColumnVisibilityChange?: (visibility: ColumnVisibilityState) => void
//     defaultColumnVisibility?: ColumnVisibilityState
//     selectedItems?: TData[]
//     onBulkDelete?: () => void
//     onRefresh?: () => void
//     isRefreshing?: boolean

//     /** First load: shows skeleton rows while there's no data yet */
//     isLoading?: boolean
//     /** Loading failed. With no rows: an error state in the table. With rows (a failed refresh): a banner above it. */
//     error?: unknown
//     /** Called by the retry buttons. Default: onRefresh */
//     onRetry?: () => void
//     /** Shown when loading finished and there are no rows at all (not because of search or filters) */
//     emptyState?: React.ReactNode
//     /** Number of skeleton rows. Default: the page size, up to 10 */
//     skeletonRows?: number

//     /** Stable id per row. Defaults to `row.id` when present, otherwise the row index. */
//     getRowId?: (row: TData, index: number) => string
//     cardFields?: {
//         title: keyof TData
//         subtitle?: keyof TData
//         description?: keyof TData
//         badge?: keyof TData
//         image?: keyof TData
//     }

//     /** Keep the toolbar pinned to the top while the page scrolls. Default: true */
//     stickyToolbar?: boolean
//     /** Keep the column header pinned (below the toolbar, if that's sticky too). Default: true */
//     stickyHeader?: boolean
//     /** Distance in px from the top of the scroll container, e.g. the height of a fixed app header. Default: 0 */
//     stickyOffset?: number
//     /** Draw vertical borders between cells. Default: false */
//     cellBorders?: boolean
//     /** Max height of the body; rows scroll inside it. Default: none (page scrolls) */
//     maxBodyHeight?: number | string

//     /** Choices in the rows-per-page select. Default: [10, 25, 50, 100] */
//     pageSizeOptions?: number[]
//     /** Server-side: called with the new page size. Enables the rows-per-page select in that mode. */
//     onPageSizeChange?: (pageSize: number) => void

//     // Server-side pagination props
//     serverSidePagination?: boolean
//     currentPage?: number
//     totalPages?: number
//     totalItems?: number
//     pageSize?: number
//     onPreviousPage?: () => void
//     onNextPage?: () => void
//     /** Jump to a specific page (1-based). Enables the numbered page links in server-side mode. */
//     onPageChange?: (page: number) => void

//     /** Show the Export button. Default: true */
//     enableExport?: boolean
//     /** Base of the export file name. Default: title, or "export" */
//     exportFilename?: string
//     /** Server mode: export all matching rows through your API (e.g. a download endpoint) */
//     onExportAll?: () => void

//     /** Content of the details drawer. Providing it makes rows clickable. */
//     renderDetails?: (row: TData) => React.ReactNode
//     /** Drawer title, e.g. the candidate's name. Default: "Details" */
//     getDetailsTitle?: (row: TData) => React.ReactNode
//     /** Line under the title, e.g. role and company */
//     getDetailsDescription?: (row: TData) => React.ReactNode
//     /** Control which row's drawer is open (row id), e.g. to open it from a "View" action */
//     detailsRowId?: string | null
//     onDetailsRowIdChange?: (rowId: string | null) => void

//     /** Show the Views menu. Default: on when persistKey is set */
//     enableViews?: boolean
//     /** Name of the built-in view without filters. Default: "All " + title */
//     defaultViewName?: string

//     /** Keyboard shortcuts: / for search, ? for help. Default: true */
//     enableKeyboardShortcuts?: boolean
// }

// function defaultGetRowId<TData>(row: TData, index: number): string {
//     const id = (row as { id?: unknown } | null)?.id
//     return id != null ? String(id) : String(index)
// }

// function sameOffsets(a: Record<string, number>, b: Record<string, number>) {
//     const keys = Object.keys(a)
//     return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
// }

// type PageItem = number | "ellipsis-start" | "ellipsis-end"

// /**
//  * Page numbers to show, e.g. [1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 12].
//  * Always shows the first and last page, plus `siblings` pages on each side of the current one.
//  * Keeps the count constant, so the bar doesn't change width as you page through.
//  */
// function getPageItems(current: number, total: number, siblings = 1): PageItem[] {
//     const range = (from: number, to: number) =>
//         Array.from({ length: to - from + 1 }, (_, i) => from + i)

//     // first + last + current + siblings on both sides + two ellipses
//     const maxItems = siblings * 2 + 5
//     if (total <= maxItems) return range(1, total)

//     const left = Math.max(current - siblings, 1)
//     const right = Math.min(current + siblings, total)
//     const showStartEllipsis = left > 3
//     const showEndEllipsis = right < total - 2
//     const edgeCount = 3 + siblings * 2 // numbers shown on the side without an ellipsis

//     if (!showStartEllipsis) return [...range(1, edgeCount), "ellipsis-end", total]
//     if (!showEndEllipsis) return [1, "ellipsis-start", ...range(total - edgeCount + 1, total)]
//     return [1, "ellipsis-start", ...range(left, right), "ellipsis-end", total]
// }

// /* ---------------------------------------------------------------------- */
// /* Copy-to-clipboard cells                                                 */
// /* ---------------------------------------------------------------------- */

// export async function copyToClipboard(text: string) {
//     if (navigator.clipboard?.writeText && window.isSecureContext) {
//         await navigator.clipboard.writeText(text)
//         return
//     }
//     // Fallback for non-HTTPS origins (e.g. testing on a LAN IP)
//     const textarea = document.createElement("textarea")
//     textarea.value = text
//     textarea.setAttribute("readonly", "")
//     textarea.style.position = "fixed"
//     textarea.style.opacity = "0"
//     document.body.appendChild(textarea)
//     textarea.select()
//     const ok = document.execCommand("copy")
//     textarea.remove()
//     if (!ok) throw new Error("Copy failed")
// }

// /** Works out what to copy for a cell, or null when there's nothing worth copying. */
// function resolveCopyText(
//     copyable: boolean | CopyableConfig | undefined,
//     value: unknown,
//     row: unknown
// ): string | null {
//     if (!copyable) return null
//     const raw = typeof copyable === "object" && copyable.getText ? copyable.getText(row) : value
//     if (typeof raw !== "string" && typeof raw !== "number") return null
//     const text = String(raw).trim()
//     return text === "" || text === "N/A" ? null : text
// }

// function CopyableCell({
//     text,
//     label,
//     children,
// }: {
//     text: string
//     label: string
//     children: React.ReactNode
// }) {
//     const [copied, setCopied] = React.useState(false)

//     React.useEffect(() => {
//         if (!copied) return
//         const timer = setTimeout(() => setCopied(false), 1500)
//         return () => clearTimeout(timer)
//     }, [copied])

//     const handleCopy = async (event: React.MouseEvent) => {
//         event.stopPropagation()
//         try {
//             await copyToClipboard(text)
//             setCopied(true)
//         } catch {
//             toast.error(`Couldn't copy ${label}. Select the text and copy it manually.`)
//         }
//     }

//     return (
//         <div className="flex min-w-0 items-center gap-1">
//             {/* truncate: any inline content (even a whitespace-nowrap span) ends in "…" instead of running under the button */}
//             <div className="min-w-0 truncate">{children}</div>
//             <Button
//                 type="button"
//                 variant="ghost"
//                 size="icon"
//                 onClick={handleCopy}
//                 aria-label={copied ? `${label} copied` : `Copy ${label}`}
//                 title={copied ? "Copied" : `Copy ${label}`}
//                 className={`h-6 w-6 shrink-0 text-muted-foreground transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${copied ? "opacity-100" : "opacity-0"
//                     }`}
//             >
//                 {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
//             </Button>
//             <span className="sr-only" aria-live="polite">
//                 {copied ? `${label} copied` : ""}
//             </span>
//         </div>
//     )
// }

// /* ---------------------------------------------------------------------- */
// /* Loading and error states                                                */
// /* ---------------------------------------------------------------------- */

// function describeError(error: unknown): string {
//     if (typeof error === "string" && error) return error
//     if (error instanceof Error && error.message) return error.message
//     return "Something went wrong. Check your connection and try again."
// }

// function SkeletonBar({ className, style }: { className?: string; style?: React.CSSProperties }) {
//     return (
//         <div
//             aria-hidden="true"
//             className={cn("animate-pulse rounded bg-muted motion-reduce:animate-none", className)}
//             style={style}
//         />
//     )
// }

// // Varied widths so the placeholder looks like real content, not a grid of identical bars
// const SKELETON_WIDTHS = ["72%", "56%", "84%", "64%", "48%"]

// function SkeletonCellContent({
//     columnId,
//     variant = "text",
//     row,
//     col,
// }: {
//     columnId: string
//     variant?: "text" | "avatar" | "badge" | "none"
//     row: number
//     col: number
// }) {
//     if (columnId === "select") {
//         return (
//             <div className="flex justify-center">
//                 <SkeletonBar className="size-4 rounded-[4px]" />
//             </div>
//         )
//     }
//     if (columnId === "actions") {
//         return (
//             <div className="flex justify-center">
//                 <SkeletonBar className="h-1.5 w-5 rounded-full" />
//             </div>
//         )
//     }
//     if (variant === "none") return null

//     const width = SKELETON_WIDTHS[(row + col) % SKELETON_WIDTHS.length]
//     if (variant === "avatar") {
//         return (
//             <div className="flex items-center gap-3">
//                 <SkeletonBar className="size-7 shrink-0 rounded-full" />
//                 <div className="flex-1 space-y-1.5">
//                     <SkeletonBar className="h-3" style={{ width }} />
//                     <SkeletonBar className="h-2.5 w-[45%]" />
//                 </div>
//             </div>
//         )
//     }
//     if (variant === "badge") return <SkeletonBar className="h-5 w-16 rounded-full" />
//     return <SkeletonBar className="h-3" style={{ width }} />
// }

// function ErrorState({
//     message,
//     onRetry,
//     isRetrying,
// }: {
//     message: string
//     onRetry?: () => void
//     isRetrying?: boolean
// }) {
//     return (
//         <div role="alert" className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 text-center">
//             <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
//                 <AlertCircle className="size-5" />
//             </div>
//             <div className="space-y-1">
//                 <p className="text-sm font-medium">Couldn’t load data</p>
//                 <p className="text-xs text-muted-foreground">{message}</p>
//             </div>
//             {onRetry && (
//                 <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
//                     <RefreshCw className={cn("mr-2 size-3.5", isRetrying && "animate-spin")} />
//                     {isRetrying ? "Retrying…" : "Try again"}
//                 </Button>
//             )}
//         </div>
//     )
// }

// // Narrow utility columns get tighter padding so the checkbox / menu button fit their width
// const cellPaddingClass = (columnId: string) => columnId === "select" ? "px-0" : columnId === "actions" ? "px-2 text-center" : "px-4"

// export function DataTable<TData extends RowData, TValue>({
//     columns,
//     data,
//     title,
//     description,
//     icon: Icon,
//     searchKey,
//     searchPlaceholder = "Search...",
//     searchColumns,
//     filterMode,
//     onFiltersChange,
//     persistKey,
//     syncUrl = false,
//     urlPrefix = "",
//     actions = [],
//     onRowSelect,
//     columnVisibility: externalColumnVisibility,
//     onColumnVisibilityChange,
//     defaultColumnVisibility,
//     selectedItems = [],
//     onBulkDelete,
//     onRefresh,
//     isRefreshing = false,
//     isLoading = false,
//     error,
//     onRetry,
//     emptyState,
//     skeletonRows,
//     getRowId,
//     cardFields,
//     stickyToolbar = true,
//     stickyHeader = true,
//     stickyOffset = 0,
//     cellBorders = false,
//     maxBodyHeight,
//     // Server-side pagination props
//     serverSidePagination = false,
//     currentPage = 1,
//     totalPages = 1,
//     totalItems = 0,
//     pageSize = 10,
//     pageSizeOptions = [10, 25, 50, 100],
//     onPreviousPage,
//     onNextPage,
//     onPageChange,
//     onPageSizeChange,

//     enableExport = true,
//     exportFilename,
//     onExportAll,

//     renderDetails,
//     getDetailsTitle,
//     getDetailsDescription,
//     detailsRowId: detailsRowIdProp,
//     onDetailsRowIdChange,
//     enableViews,
//     defaultViewName,
//     enableKeyboardShortcuts = true,

// }: DataTableProps<TData, TValue>) {
//     // Read once, before the first render
//     const filterConfigs = React.useMemo(() => filterConfigsOf(columns), [columns]);
//     const [stored] = React.useState(() => (persistKey ? loadTableSettings(persistKey) : null));
//     const [urlState] = React.useState(() => (syncUrl ? readFiltersFromUrl(filterConfigs, urlPrefix) : null));

//     const [views, setViews] = React.useState<SavedView[]>(() => (persistKey ? loadViews(persistKey) : []))
//     const [activeViewId, setActiveViewId] = React.useState<string | null>(() => {
//         const id = stored?.activeViewId ?? null
//         return id && views.some((view) => view.id === id) ? id : null
//     })

//     // A shared link with filters wins over the active view's filters
//     const urlHasFilters = !!urlState && (urlState.columnFilters.length > 0 || !!urlState.search)
//     const initialView = views.find((view) => view.id === activeViewId)

//     const [sorting, setSorting] = React.useState<SortingState>(() => {
//         // Drop saved sorts for columns that no longer exist
//         const knownIds = new Set(columns.map((column) => getColumnId(column as never)))
//         return (stored?.sorting ?? []).filter((sort) => knownIds.has(sort.id))
//     });
//     const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(() => stored?.sizing ?? {});

//     const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() =>
//         urlHasFilters
//             ? urlState!.columnFilters
//             : (initialView?.columnFilters ?? []).filter((filter) => filterConfigs.has(filter.id))
//     )

//     const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<ColumnVisibilityState>({});
//     const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});


//     // The row that receives focus when tabbing into the table
//     const [focusedRowId, setFocusedRowId] = React.useState<string | null>(null)
//     // Bumped to ask for focus on the focused row after the next render (e.g. after a page change)
//     const [focusRequest, setFocusRequest] = React.useState(0)
//     const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
//     const lastDetailsRowIdRef = React.useRef<string | null>(null)

//     // Controlled when the parent passes detailsRowId, otherwise internal
//     const [internalDetailsRowId, setInternalDetailsRowId] = React.useState<string | null>(null)
//     const detailsRowId = detailsRowIdProp !== undefined ? detailsRowIdProp : internalDetailsRowId
//     const setDetailsRowId = onDetailsRowIdChange ?? setInternalDetailsRowId

//     const resolveRowId = React.useCallback(
//         (row: TData, index: number) => (getRowId ? getRowId(row, index) : defaultGetRowId(row, index)),
//         [getRowId]
//     )

//     const isServerFiltering = (filterMode ?? (serverSidePagination ? "server" : "client")) === "server"

//     const searchColumnIds = React.useMemo(
//         () => searchColumns ?? (searchKey ? [searchKey] : []),
//         // join: a new array with the same ids shouldn't rebuild the search cache
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//         [(searchColumns ?? [searchKey]).join("|")]
//     )
//     const globalSearchFn = React.useMemo(() => createGlobalSearchFn(searchColumnIds), [searchColumnIds])

//     // What's in the input (instant) vs. what the table filters by (debounced)
//     const [searchInput, setSearchInput] = React.useState(() => (urlHasFilters ? urlState!.search : initialView?.search ?? ""))
//     const [globalFilter, setGlobalFilter] = React.useState(() => (urlHasFilters ? urlState!.search : initialView?.search ?? ""))

//     const searchInputRef = React.useRef<HTMLInputElement>(null)
//     const [filtersView, setFiltersView] = React.useState<FilterView>({ open: false, columnId: null })

//     // Clear both at once, so the search chip disappears immediately instead of after the debounce
//     const clearSearch = () => {
//         setSearchInput("")
//         setGlobalFilter("")
//     }

//     React.useEffect(() => {
//         const timer = setTimeout(() => setGlobalFilter(searchInput), 200)
//         return () => clearTimeout(timer)
//     }, [searchInput])


//     // Use external column visibility if provided, otherwise use internal state
//     const columnVisibility = externalColumnVisibility ?? internalColumnVisibility
//     const handleColumnVisibilityChange = React.useCallback((updaterOrValue: ColumnVisibilityState | ((prev: ColumnVisibilityState) => ColumnVisibilityState)) => {
//         if (onColumnVisibilityChange) {
//             if (typeof updaterOrValue === 'function') {
//                 const newVisibility = updaterOrValue(externalColumnVisibility ?? {})
//                 onColumnVisibilityChange(newVisibility)
//             } else {
//                 onColumnVisibilityChange(updaterOrValue)
//             }
//         } else {
//             setInternalColumnVisibility(updaterOrValue)
//         }
//     }, [onColumnVisibilityChange, externalColumnVisibility])

//     // Add selection column if onRowSelect is provided
//     const tableColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
//         const withFilterFns = (columns as ColumnDef<TData, unknown>[]).map((column) => {
//             const type = column.meta?.filter?.type
//             return type && !column.filterFn ? { ...column, filterFn: FILTER_FN_BY_TYPE[type] } : column
//         })

//         if (!onRowSelect) return withFilterFns


//         const selectColumn: ColumnDef<TData, unknown> = {
//             id: "select",
//             size: 56,
//             minSize: 56,
//             maxSize: 56,
//             enableResizing: false,
//             meta: {
//                 sticky: "left",
//             },
//             header: ({ table }) => (
//                 <div className="flex items-center justify-center">
//                     <Checkbox
//                         checked={
//                             table.getIsAllPageRowsSelected() ||
//                             (table.getIsSomePageRowsSelected() && "indeterminate")
//                         }
//                         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
//                         aria-label="Select all"
//                     />
//                 </div>

//             ),
//             cell: ({ row }) => (
//                 <div className="flex items-center justify-center">
//                     <Checkbox
//                         checked={row.getIsSelected()}
//                         onCheckedChange={(value) => row.toggleSelected(!!value)}
//                         aria-label="Select row"
//                     />
//                 </div>

//             ),
//             enableSorting: false,
//             enableHiding: false,
//         }

//         return [selectColumn, ...withFilterFns]
//     }, [columns, onRowSelect])

//     // Add actions column if actions are provided
//     const finalColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
//         if (actions.length === 0) return tableColumns

//         const actionsColumn: ColumnDef<TData, unknown> = {
//             id: "actions",
//             size: 60,
//             minSize: 60,
//             maxSize: 80,
//             enableResizing: false,
//             meta: {
//                 sticky: "right",
//             },
//             header: "Actions",
//             cell: ({ row }) => {
//                 const rowData = row.original
//                 const visibleActions = actions.filter(action =>
//                     !action.show || action.show(rowData)
//                 )

//                 if (visibleActions.length === 0) return null

//                 return (
//                     <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                             <Button variant="ghost" className="h-8 w-8 p-0">
//                                 <span className="sr-only">Open menu</span>
//                                 <MoreHorizontal className="h-4 w-4" />
//                             </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                             <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                             <DropdownMenuSeparator />
//                             {visibleActions.map((action, index) => (
//                                 <DropdownMenuItem
//                                     key={index}
//                                     onClick={() => action.onClick(rowData)}
//                                     className={action.variant === "destructive" ? "text-destructive" : ""}
//                                 >
//                                     {action.icon && <action.icon className="mr-2 h-4 w-4" />}
//                                     {action.label}
//                                 </DropdownMenuItem>
//                             ))}
//                         </DropdownMenuContent>
//                     </DropdownMenu>
//                 )
//             },
//             enableSorting: false,
//             enableHiding: false,
//         }

//         return [...tableColumns, actionsColumn]
//     }, [tableColumns, actions]);

//     /* ------------------------------------------------------------------ */
//     /* Column order: pinned columns stay at the edges, the rest are movable */
//     /* ------------------------------------------------------------------ */
//     const columnIdOf = (def: ColumnDef<TData, unknown>) =>
//         def.id ?? ("accessorKey" in def && def.accessorKey != null ? String(def.accessorKey) : "")

//     const { leftPinnedIds, rightPinnedIds, defaultMovableIds } = React.useMemo(() => {
//         const left: string[] = []
//         const right: string[] = []
//         const movable: string[] = []
//         for (const def of finalColumns) {
//             const id = columnIdOf(def)
//             if (!id) continue
//             const sticky = def.meta?.sticky
//             if (sticky === "left") left.push(id)
//             else if (sticky === "right") right.push(id)
//             else movable.push(id)
//         }
//         return { leftPinnedIds: left, rightPinnedIds: right, defaultMovableIds: movable }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [finalColumns])

//     const [movableOrder, setMovableOrder] = React.useState<string[]>(() => stored?.order ?? []);

//     // Saved order, minus columns that no longer exist, plus new columns at the end
//     const resolveOrder = React.useCallback(
//         (order: string[]) => {
//             const known = new Set(defaultMovableIds)
//             const kept = order.filter((id) => known.has(id))
//             const keptSet = new Set(kept)
//             return [...kept, ...defaultMovableIds.filter((id) => !keptSet.has(id))]
//         },
//         [defaultMovableIds]
//     )
//     const orderedMovableIds = React.useMemo(() => resolveOrder(movableOrder), [resolveOrder, movableOrder])

//     const columnOrder = React.useMemo(
//         () => [...leftPinnedIds, ...orderedMovableIds, ...rightPinnedIds],
//         [leftPinnedIds, orderedMovableIds, rightPinnedIds]
//     )

//     /* ------------------------------------------------------------------ */
//     /* Reset to default (order + visibility)                               */
//     /* ------------------------------------------------------------------ */

//     // Captured once, so later changes (like "Show all") don't become the new default
//     const initialVisibilityRef = React.useRef<ColumnVisibilityState>(
//         externalColumnVisibility ?? internalColumnVisibility
//     );

//     // Restore saved visibility before the browser paints, so hidden columns don't flash.
//     // Saved values sit on top of the defaults, so columns added later still get their default.
//     React.useLayoutEffect(() => {
//         if (stored?.visibility) {
//             handleColumnVisibilityChange({ ...initialVisibilityRef.current, ...stored.visibility })
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [])

//     const defaultVisibility = defaultColumnVisibility ?? initialVisibilityRef.current

//     const resetColumns = () => {
//         setMovableOrder([])
//         setColumnSizing({})
//         handleColumnVisibilityChange(defaultVisibility)
//     }

//     /* ------------------------------------------------------------------ */
//     /* Saved views                                                         */
//     /* ------------------------------------------------------------------ */
//     const viewsEnabled = enableViews ?? !!persistKey
//     const knownColumnIds = new Set(columnOrder)

//     const currentViewState: ViewState = {
//         search: globalFilter,
//         columnFilters,
//         sorting,
//         order: movableOrder,
//         visibility: columnVisibility,
//         sizing: columnSizing,
//     }
//     const defaultViewState: ViewState = {
//         search: "",
//         columnFilters: [],
//         sorting: [],
//         order: [],
//         visibility: defaultVisibility,
//         sizing: {},
//     }

//     const viewContext = { columnIds: columnOrder, resolveOrder }
//     const activeView = views.find((view) => view.id === activeViewId)
//     const isViewModified =
//         viewStateKey(currentViewState, viewContext) !== viewStateKey(activeView ?? defaultViewState, viewContext)

//     const applyViewState = (state: ViewState) => {
//         // Skip anything that refers to columns that no longer exist
//         setColumnFilters(state.columnFilters.filter((filter) => filterConfigs.has(filter.id)))
//         setSearchInput(state.search)
//         setGlobalFilter(state.search)
//         setSorting(state.sorting.filter((sort) => knownColumnIds.has(sort.id)))
//         setMovableOrder(state.order)
//         setColumnSizing(state.sizing)
//         handleColumnVisibilityChange({ ...defaultVisibility, ...state.visibility })
//     }

//     const selectView = (viewId: string | null) => {
//         const view = views.find((v) => v.id === viewId)
//         applyViewState(view ?? defaultViewState)
//         setActiveViewId(view ? view.id : null)
//     }

//     const saveNewView = (name: string) => {
//         const view: SavedView = { id: createViewId(), name, updatedAt: Date.now(), ...currentViewState }
//         setViews((prev) => [...prev, view])
//         setActiveViewId(view.id)
//         toast.success(`Saved view “${name}”`)
//     }

//     const updateActiveView = () => {
//         if (!activeView) return
//         setViews((prev) =>
//             prev.map((view) => (view.id === activeView.id ? { ...view, ...currentViewState, updatedAt: Date.now() } : view))
//         )
//         toast.success(`Updated “${activeView.name}”`)
//     }

//     const renameActiveView = (name: string) => {
//         setViews((prev) => prev.map((view) => (view.id === activeViewId ? { ...view, name } : view)))
//     }

//     const deleteActiveView = () => {
//         const index = views.findIndex((view) => view.id === activeViewId)
//         const view = views[index]
//         if (!view) return
//         setViews((prev) => prev.filter((v) => v.id !== view.id))
//         setActiveViewId(null) // the table keeps its current setup, now compared to the default
//         toast(`Deleted view “${view.name}”`, {
//             action: {
//                 label: "Undo",
//                 onClick: () => {
//                     setViews((prev) => {
//                         const next = [...prev]
//                         next.splice(Math.min(index, next.length), 0, view)
//                         return next
//                     })
//                     setActiveViewId(view.id)
//                 },
//             },
//         })
//     }

//     // Save the list whenever it changes
//     React.useEffect(() => {
//         if (persistKey) saveViews(persistKey, views)
//     }, [persistKey, views]);

//     // Client mode only: in server mode, the parent owns the page size
//     const initialPageSize = !serverSidePagination && stored?.pageSize && pageSizeOptions.includes(stored.pageSize)
//         ? stored.pageSize
//         : pageSize

//     const table = useTable({
//         features: dataTableFeatures,
//         data,
//         columns: finalColumns,
//         getRowId: resolveRowId,
//         initialState: { pagination: { pageIndex: 0, pageSize: initialPageSize } },
//         onSortingChange: setSorting,
//         onColumnFiltersChange: setColumnFilters,
//         onGlobalFilterChange: setGlobalFilter,
//         onColumnVisibilityChange: handleColumnVisibilityChange,
//         onRowSelectionChange: setRowSelection,
//         globalFilterFn: globalSearchFn,
//         getColumnCanGlobalFilter: (column) => column.id === searchColumnIds[0],
//         manualFiltering: isServerFiltering,
//         manualPagination: serverSidePagination,
//         pageCount: serverSidePagination ? totalPages : undefined,
//         columnResizeMode: "onChange",
//         onColumnSizingChange: setColumnSizing,
//         state: {
//             sorting,
//             columnFilters,
//             globalFilter,
//             columnVisibility,
//             columnOrder,
//             columnSizing,
//             rowSelection,
//             ...(serverSidePagination
//                 ? { pagination: { pageIndex: currentPage - 1, pageSize } satisfies PaginationState }
//                 : {}),
//         },
//     });

//     /* ------------------------------------------------------------------ */
//     /* Loading / error                                                     */
//     /* ------------------------------------------------------------------ */
//     const hasData = data.length > 0
//     const showSkeleton = isLoading && !hasData
//     const showErrorState = !!error && !hasData && !isLoading
//     const showStaleBanner = !!error && hasData
//     const retry = onRetry ?? onRefresh
//     const skeletonCount =
//         skeletonRows ?? Math.min(serverSidePagination ? pageSize : table.state.pagination.pageSize, 10)
//     const statusMessage = showSkeleton ? "Loading…" : isRefreshing ? "Refreshing…" : ""

//     const clientPageSize = table.state.pagination.pageSize

//     // Save layout preferences whenever they change
//     React.useEffect(() => {
//         if (!persistKey) return;
//         saveTableSettings(persistKey, {
//             order: movableOrder,
//             visibility: columnVisibility,
//             sorting,
//             sizing: columnSizing,
//             pageSize: serverSidePagination ? undefined : clientPageSize,
//             activeViewId,
//         });
//     }, [persistKey, movableOrder, columnVisibility, sorting, columnSizing, serverSidePagination, clientPageSize])

//     // Mirror the applied search and filters into the URL
//     React.useEffect(() => {
//         if (syncUrl) writeFiltersToUrl(columnFilters, globalFilter, filterConfigs, urlPrefix)
//     }, [syncUrl, columnFilters, globalFilter, filterConfigs, urlPrefix])

//     // Skip the first render: nothing has changed yet
//     const filtersMounted = React.useRef(false)
//     React.useEffect(() => {
//         if (!filtersMounted.current) {
//             filtersMounted.current = true
//             // Filters loaded from the URL: the parent's first request should include them
//             if (isServerFiltering && (columnFilters.length > 0 || globalFilter)) {
//                 onFiltersChange?.({ columnFilters, globalFilter })
//             }
//             return
//         }

//         if (isServerFiltering) {
//             onFiltersChange?.({ columnFilters, globalFilter })
//         } else {
//             table.setPageIndex(0)
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [columnFilters, globalFilter])

//     // Columns missing from the visibility map count as visible, same as TanStack
//     const isDefaultColumns =
//         Object.keys(columnSizing).length === 0 &&
//         orderedMovableIds.every((id, index) => id === defaultMovableIds[index]) &&
//         table
//             .getAllLeafColumns()
//             .every((column) => (defaultVisibility[column.id] ?? true) === column.getIsVisible())

//     /* ------------------------------------------------------------------ */
//     /* Sticky toolbar height: the header sticks right below it            */
//     /* ------------------------------------------------------------------ */
//     const toolbarRef = React.useRef<HTMLDivElement>(null)
//     const [toolbarHeight, setToolbarHeight] = React.useState(0)

//     React.useLayoutEffect(() => {
//         const el = toolbarRef.current
//         if (!el || !stickyToolbar) return
//         const measure = () => setToolbarHeight(el.offsetHeight)
//         measure()
//         const observer = new ResizeObserver(measure)
//         observer.observe(el)
//         return () => observer.disconnect()
//     }, [stickyToolbar])

//     const headerTop = stickyOffset + (stickyToolbar ? toolbarHeight : 0)

//     /* ------------------------------------------------------------------ */
//     /* Horizontal scroll sync between the header table and the body table */
//     /* ------------------------------------------------------------------ */
//     const headScrollRef = React.useRef<HTMLDivElement>(null);
//     const bodyScrollRef = React.useRef<HTMLDivElement>(null);
//     const scrollbarRef = React.useRef<HTMLDivElement>(null);
//     const scrollbarInnerRef = React.useRef<HTMLDivElement>(null);

//     // Moves every horizontal strip to x in the same frame. The 1px tolerance stops
//     // strips with fractional widths from nudging each other back and forth.
//     const scrollAllTo = (x: number, source?: HTMLElement) => {
//         for (const el of [headScrollRef.current, bodyScrollRef.current, scrollbarRef.current]) {
//             if (el && el !== source && Math.abs(el.scrollLeft - x) >= 1) el.scrollLeft = x
//         }
//     }
//     const syncFrom = (event: React.UIEvent<HTMLElement>) =>
//         scrollAllTo(event.currentTarget.scrollLeft, event.currentTarget)

//     // Native scrolling moves the body on the compositor thread and only then tells JS,
//     // so a header synced in onScroll trails by a frame (the "jitter"). For wheel and
//     // trackpad input we apply the offset to both tables ourselves, in the same frame.
//     // onScroll above still covers scrollbar dragging and keyboard scrolling.
//     React.useEffect(() => {
//         const head = headScrollRef.current
//         const body = bodyScrollRef.current
//         if (!head || !body) return

//         const onWheel = (event: WheelEvent) => {
//             const horizontal = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX
//             const vertical = event.shiftKey ? 0 : event.deltaY
//             // Mostly vertical gesture: leave it alone so the page scrolls normally
//             if (horizontal === 0 || Math.abs(horizontal) < Math.abs(vertical)) return

//             const maxScroll = body.scrollWidth - body.clientWidth
//             if (maxScroll <= 0) return

//             event.preventDefault()
//             const step = event.deltaMode === 1 ? horizontal * 16 : horizontal // line-based wheels (Firefox)
//             const next = Math.max(0, Math.min(maxScroll, body.scrollLeft + step))
//             scrollAllTo(next);
//         }

//         head.addEventListener("wheel", onWheel, { passive: false })
//         body.addEventListener("wheel", onWheel, { passive: false })
//         return () => {
//             head.removeEventListener("wheel", onWheel)
//             body.removeEventListener("wheel", onWheel)
//         }
//     }, [])

//     /* ------------------------------------------------------------------ */
//     /* Sticky columns: offsets measured from the rendered header cells    */
//     /* ------------------------------------------------------------------ */
//     const tableWrapperRef = React.useRef<HTMLDivElement>(null)
//     const [stickyOffsets, setStickyOffsets] = React.useState<Record<string, number>>({})

//     const visibleLeafColumns = table.getVisibleLeafColumns();
//     const visibleColumnsKey = visibleLeafColumns.map((c) => c.id).join("|")
//     const leftStickyIds = visibleLeafColumns.filter((c) => c.columnDef.meta?.sticky === "left").map((c) => c.id)
//     const rightStickyIds = visibleLeafColumns.filter((c) => c.columnDef.meta?.sticky === "right").map((c) => c.id)
//     const lastLeftStickyId = leftStickyIds[leftStickyIds.length - 1]
//     const firstRightStickyId = rightStickyIds[0]

//     /* ------------------------------------------------------------------ */
//     /* Column resizing                                                     */
//     /* ------------------------------------------------------------------ */
//     const isResizing = visibleLeafColumns.some((column) => column.getIsResizing())

//     // Keyboard resizing: ←/→ in 10px steps, Shift for 50px, within the column's min/max
//     const resizeBy = (columnId: string, delta: number) => {
//         const column = table.getColumn(columnId)
//         if (!column) return
//         const min = column.columnDef.minSize ?? 40
//         const max = column.columnDef.maxSize ?? 1000
//         const next = Math.min(max, Math.max(min, column.getSize() + delta))
//         setColumnSizing((prev) => ({ ...prev, [columnId]: next }))
//     }


//     React.useLayoutEffect(() => {
//         const wrapper = tableWrapperRef.current
//         if (!wrapper) return

//         const ids = visibleColumnsKey ? visibleColumnsKey.split("|") : []
//         const stickyOf = (id: string) => table.getColumn(id)?.columnDef.meta?.sticky
//         const widthOf = (id: string) =>
//             wrapper.querySelector<HTMLElement>(`thead th[data-column-id="${CSS.escape(id)}"]`)?.offsetWidth ?? 0

//         const measure = () => {
//             const next: Record<string, number> = {}

//             let left = 0
//             for (const id of ids.filter((id) => stickyOf(id) === "left")) {
//                 next[id] = left
//                 left += widthOf(id)
//             }

//             let right = 0
//             for (const id of ids.filter((id) => stickyOf(id) === "right").reverse()) {
//                 next[id] = right
//                 right += widthOf(id)
//             }

//             setStickyOffsets((prev) => (sameOffsets(prev, next) ? prev : next))
//         }

//         measure()
//         const observer = new ResizeObserver(measure)
//         wrapper.querySelectorAll("thead th").forEach((th) => observer.observe(th))
//         return () => observer.disconnect()
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [visibleColumnsKey])

//     const getSticky = (columnId: string, isHeader = false) => {
//         const side = table.getColumn(columnId)?.columnDef.meta?.sticky
//         if (!side) return { side: undefined, edge: undefined, style: {} as React.CSSProperties }

//         const isEdge = columnId === lastLeftStickyId || columnId === firstRightStickyId
//         const offset = stickyOffsets[columnId] ?? 0

//         return {
//             side,
//             edge: isEdge ? side : undefined,
//             style: {
//                 position: "sticky",
//                 [side]: isHeader && side === "right"
//                     ? `calc(${offset}px + var(--dt-gutter, 0px))`
//                     : offset,
//                 zIndex: isHeader ? 3 : 2,
//             } as React.CSSProperties,
//         }
//     }

//     /* ------------------------------------------------------------------ */
//     /* Visual state flags, set as data attributes on the wrapper:         */
//     /*  data-stuck          header is currently pinned                    */
//     /*  data-overflow-left  columns are hidden off the left edge          */
//     /*  data-overflow-right columns are hidden off the right edge         */
//     /* Written straight to the DOM so scrolling never re-renders React.   */
//     /* ------------------------------------------------------------------ */
//     React.useEffect(() => {
//         const wrapper = tableWrapperRef.current
//         const head = headScrollRef.current
//         const body = bodyScrollRef.current
//         if (!wrapper || !head || !body) return

//         /* --- Cheap, runs on scroll: only reads positions, never writes styles --- */
//         let frame = 0
//         const updateFlags = () => {
//             frame = 0
//             const stuck =
//                 stickyHeader &&
//                 head.getBoundingClientRect().top - wrapper.getBoundingClientRect().top > 0.5
//             wrapper.toggleAttribute("data-stuck", stuck)

//             const maxScroll = body.scrollWidth - body.clientWidth
//             wrapper.toggleAttribute("data-overflow-left", body.scrollLeft > 1)
//             wrapper.toggleAttribute("data-overflow-right", body.scrollLeft < maxScroll - 1)
//         }
//         const scheduleFlags = () => {
//             if (!frame) frame = requestAnimationFrame(updateFlags)
//         }

//         /* --- Runs only when sizes change: body's vertical scrollbar width --- */
//         let lastGutter = ""
//         const updateGutter = () => {
//             const bodyStyle = getComputedStyle(body)
//             const scrollbar = Math.max(0, body.offsetWidth - body.clientWidth
//                 - parseFloat(bodyStyle.borderLeftWidth)
//                 - parseFloat(bodyStyle.borderRightWidth))
//             const gutter = `${scrollbar}px`
//             if (gutter !== lastGutter) {
//                 lastGutter = gutter
//                 wrapper.style.setProperty("--dt-gutter", gutter)
//             }

//             wrapper.style.setProperty("--dt-body-width", `${body.clientWidth}px`);
//             wrapper.style.setProperty("--dt-head-height", `${head.offsetHeight}px`);

//             // The proxy is wider than the body's visible area by the gutter, so its content
//             // gets the same extra width; that gives both the same maximum scroll
//             const inner = scrollbarInnerRef.current
//             if (inner) {
//                 const width = `${body.scrollWidth + scrollbar}px`
//                 if (inner.style.width !== width) inner.style.width = width
//             }
//         }
//         const onResize = () => {
//             updateGutter()
//             scheduleFlags()
//         }

//         updateGutter()
//         updateFlags()
//         document.addEventListener("scroll", scheduleFlags, { capture: true, passive: true });
//         window.addEventListener("resize", onResize);
//         const observer = new ResizeObserver(onResize);
//         observer.observe(body);
//         observer.observe(wrapper);
//         // The table's width changes on its own when columns are shown or hidden
//         const bodyTable = body.querySelector("table");
//         if (bodyTable) observer.observe(bodyTable);

//         return () => {
//             document.removeEventListener("scroll", scheduleFlags, { capture: true })
//             window.removeEventListener("resize", onResize)
//             observer.disconnect()
//             cancelAnimationFrame(frame)
//         }
//     }, [stickyHeader, visibleColumnsKey, maxBodyHeight]);

//     // Both tables share these widths, so the header and body columns line up exactly
//     const tableStyle: React.CSSProperties = { width: table.getTotalSize(), minWidth: "100%" }
//     // The header strip is wider than the body's visible area by the gutter, so the
//     // header table fills the strip minus that gutter, matching the body table exactly
//     const headTableStyle: React.CSSProperties = {
//         width: table.getTotalSize(),
//         minWidth: "calc(100% - var(--dt-gutter, 0px))",
//     }

//     const colGroup = (
//         <colgroup>
//             {visibleLeafColumns.map((column) => (
//                 <col key={column.id} style={{ width: column.getSize() }} />
//             ))}
//         </colgroup>
//     )

//     /* ------------------------------------------------------------------ */
//     /* Selection                                                           */
//     /* ------------------------------------------------------------------ */

//     // Drop selection entries for rows that no longer exist (delete, refresh, refetch)
//     React.useEffect(() => {
//         const ids = new Set(data.map((row, index) => resolveRowId(row, index)))
//         setRowSelection((prev) => {
//             const keys = Object.keys(prev)
//             const kept = keys.filter((id) => ids.has(id))
//             if (kept.length === keys.length) return prev
//             const next: RowSelectionState = {}
//             for (const id of kept) next[id] = true
//             return next
//         })
//     }, [data, resolveRowId])

//     // Report selection to the parent whenever it, or the underlying data, changes
//     React.useEffect(() => {
//         if (!onRowSelect) return
//         onRowSelect(table.getFilteredSelectedRowModel().rows.map((row) => row.original))
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [rowSelection, data, onRowSelect])

//     const selectedRowCount = table.getFilteredSelectedRowModel().rows.length

//     const renderMobileCard = (row: Row<DataTableFeatures, TData>) => {
//         if (!cardFields) return null

//         const rowData = row.original
//         const visibleActions = actions.filter(action =>
//             !action.show || action.show(rowData)
//         )

//         return (
//             <Card
//                 key={row.id}
//                 onClick={(event) => handleRowClick(event, row.id)}
//                 className={cn("mb-4", renderDetails && "cursor-pointer", row.id === detailsRowId && "ring-2 ring-ring/40")}
//             >
//                 <CardHeader className="pb-3">
//                     <div className="flex items-start justify-between">
//                         <div className="flex items-center space-x-3">
//                             {onRowSelect && (
//                                 <Checkbox
//                                     checked={row.getIsSelected()}
//                                     onCheckedChange={(value) => row.toggleSelected(!!value)}
//                                     aria-label="Select row"
//                                 />
//                             )}
//                             {cardFields.image && (() => {
//                                 const imageData = rowData[cardFields.image]
//                                 const imageUrl = Array.isArray(imageData) ? imageData[0] : imageData
//                                 return imageUrl && String(imageUrl).trim() !== '' ? (
//                                     <div className="relative h-12 w-12 rounded-md overflow-hidden shrink-0">
//                                         <img
//                                             src={imageUrl as string}
//                                             alt={rowData[cardFields.title] as string}
//                                             loading="lazy"
//                                             className="h-full w-full object-cover"
//                                         />
//                                     </div>
//                                 ) : null
//                             })()}
//                             <div>
//                                 <CardTitle className="text-base">
//                                     {rowData[cardFields.title] as string}
//                                 </CardTitle>
//                                 {cardFields.subtitle && (
//                                     <p className="text-sm text-muted-foreground">
//                                         {rowData[cardFields.subtitle] as string}
//                                     </p>
//                                 )}
//                             </div>
//                         </div>
//                         {visibleActions.length > 0 && (
//                             <DropdownMenu>
//                                 <DropdownMenuTrigger asChild>
//                                     <Button variant="ghost" className="h-8 w-8 p-0">
//                                         <MoreHorizontal className="h-4 w-4" />
//                                     </Button>
//                                 </DropdownMenuTrigger>
//                                 <DropdownMenuContent align="end">
//                                     <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                                     <DropdownMenuSeparator />
//                                     {visibleActions.map((action, index) => (
//                                         <DropdownMenuItem
//                                             key={index}
//                                             onClick={() => action.onClick(rowData)}
//                                             className={action.variant === "destructive" ? "text-destructive" : ""}
//                                         >
//                                             {action.icon && <action.icon className="mr-2 h-4 w-4" />}
//                                             {action.label}
//                                         </DropdownMenuItem>
//                                     ))}
//                                 </DropdownMenuContent>
//                             </DropdownMenu>
//                         )}
//                     </div>
//                     {cardFields.badge && rowData[cardFields.badge] && (
//                         <Badge variant="secondary" className="w-fit">
//                             {rowData[cardFields.badge] as string}
//                         </Badge>
//                     )}
//                 </CardHeader>
//                 {cardFields.description && rowData[cardFields.description] && (
//                     <CardContent className="pt-0">
//                         <p className="text-sm text-muted-foreground">
//                             {rowData[cardFields.description] as string}
//                         </p>
//                     </CardContent>
//                 )}
//             </Card>
//         )
//     }

//     /* ------------------------------------------------------------------ */
//     /* Pagination                                                          */
//     /* ------------------------------------------------------------------ */
//     const pageNumber = serverSidePagination
//         ? currentPage
//         : table.state.pagination.pageIndex + 1
//     const pageCount = serverSidePagination
//         ? Math.max(1, totalPages)
//         : Math.max(1, table.getPageCount())
//     const currentPageSize = serverSidePagination
//         ? pageSize
//         : table.state.pagination.pageSize
//     const totalCount = serverSidePagination
//         ? totalItems
//         : table.getFilteredRowModel().rows.length

//     const canPreviousPage = pageNumber > 1
//     const canNextPage = pageNumber < pageCount
//     // Server-side without onPageChange can only step back/forward, so numbers aren't clickable
//     const canJumpToPage = !serverSidePagination || !!onPageChange
//     // Server-side needs a callback to change the size; client-side handles it itself
//     const canChangePageSize = !serverSidePagination || !!onPageSizeChange

//     // "Showing 11–12 of 12"
//     const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * currentPageSize + 1
//     const rangeEnd = Math.min(pageNumber * currentPageSize, totalCount)

//     // Keep the size the parent passed selectable even if it's not in the list
//     const sizeChoices = pageSizeOptions.includes(currentPageSize)
//         ? pageSizeOptions
//         : [...pageSizeOptions, currentPageSize].sort((a, b) => a - b)

//     const goToPage = (page: number) => {
//         if (page < 1 || page > pageCount || page === pageNumber) return
//         if (!serverSidePagination) {
//             table.setPageIndex(page - 1)
//         } else if (onPageChange) {
//             onPageChange(page)
//         } else if (page === pageNumber - 1) {
//             onPreviousPage?.()
//         } else if (page === pageNumber + 1) {
//             onNextPage?.()
//         }
//     }

//     const changePageSize = (size: number) => {
//         if (size === currentPageSize) return
//         if (serverSidePagination) {
//             onPageSizeChange?.(size)
//             return
//         }
//         // Stay on the page that contains the row currently at the top,
//         // instead of jumping back to page 1
//         const firstRowIndex = (pageNumber - 1) * currentPageSize
//         table.setPagination({ pageIndex: Math.floor(firstRowIndex / size), pageSize: size })
//     }

//     // shadcn's links are <a> elements: keep href="#" so they stay keyboard-focusable,
//     // but stop the navigation and handle the click ourselves
//     const pageLinkProps = (page: number, enabled = true) => ({
//         href: "#",
//         onClick: (event: React.MouseEvent) => {
//             event.preventDefault()
//             if (enabled) goToPage(page)
//         },
//         "aria-disabled": enabled ? undefined : true,
//         tabIndex: enabled ? undefined : -1,
//         className: enabled ? undefined : "pointer-events-none opacity-50",
//     })

//     /* ------------------------------------------------------------------ */
//     /* Selection summary                                                   */
//     /* ------------------------------------------------------------------ */
//     const matchingRows = table.getPrePaginatedRowModel().rows // filtered + sorted, all pages
//     const totalSelected = Object.keys(rowSelection).length

//     // Which pages hold selected rows, and how many on each
//     const selectedByPage = new Map<number, number>()
//     matchingRows.forEach((row, index) => {
//         if (!row.getIsSelected()) return
//         const page = serverSidePagination ? pageNumber : Math.floor(index / currentPageSize) + 1
//         selectedByPage.set(page, (selectedByPage.get(page) ?? 0) + 1)
//     })
//     const selectedOnThisPage = selectedByPage.get(pageNumber) ?? 0
//     const otherSelectedPages = [...selectedByPage.keys()].filter((page) => page !== pageNumber).sort((a, b) => a - b)

//     // Selected rows the current filters hide: kept, but left out of bulk actions
//     const hiddenSelectedCount = totalSelected - selectedRowCount

//     // Offer "Select all N" once the whole page is ticked and more matching rows exist
//     const canSelectAllMatching =
//         !serverSidePagination && table.getIsAllPageRowsSelected() && selectedRowCount < matchingRows.length

//     const selectAllMatching = () =>
//         table.setRowSelection((prev) => {
//             const next = { ...prev }
//             for (const row of matchingRows) if (row.getCanSelect()) next[row.id] = true
//             return next
//         })


//     /* ------------------------------------------------------------------ */
//     /* Details drawer                                                      */
//     /* ------------------------------------------------------------------ */
//     const detailsIndex = detailsRowId ? matchingRows.findIndex((row) => row.id === detailsRowId) : -1
//     const detailsRow = detailsIndex >= 0 ? matchingRows[detailsIndex] : undefined

//     // The open row was deleted or filtered out: close the drawer
//     React.useEffect(() => {
//         if (detailsRowId && !detailsRow && !isLoading) setDetailsRowId(null)
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [detailsRowId, detailsRow, isLoading])

//     // Keep the active row in view while stepping through rows
//     React.useEffect(() => {
//         if (!detailsRowId) return
//         bodyScrollRef.current
//             ?.querySelector<HTMLElement>(`tr[data-row-id="${CSS.escape(detailsRowId)}"]`)
//             ?.scrollIntoView({ block: "nearest" })
//     }, [detailsRowId, pageNumber])

//     const stepDetails = (delta: number) => {
//         const nextIndex = detailsIndex + delta
//         const next = matchingRows[nextIndex]
//         if (!next) return
//         setDetailsRowId(next.id)
//         setFocusedRowId(next.id) // closing the drawer returns focus here


//         // Follow the row onto its page
//         if (!serverSidePagination) {
//             const page = Math.floor(nextIndex / currentPageSize) + 1
//             if (page !== pageNumber) goToPage(page)
//         }
//     }

//     // Clicks on controls inside a row keep their own behavior
//     const INTERACTIVE_SELECTOR =
//         "button, a, input, select, textarea, label, [role='checkbox'], [role='menuitem'], [data-no-row-click]"

//     const handleRowClick = (event: React.MouseEvent, rowId: string) => {
//         if (!renderDetails) return
//         if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return
//         // The user was selecting text, not clicking
//         if (window.getSelection()?.toString()) return
//         setDetailsRowId(rowId)
//     }

//     /* ------------------------------------------------------------------ */
//     /* Keyboard navigation                                                 */
//     /* ------------------------------------------------------------------ */
//     const pageRows = table.getRowModel().rows

//     // Only one row is in the tab order: the focused one if it's on this page, else the first
//     const rovingRowId =
//         focusedRowId && pageRows.some((row) => row.id === focusedRowId) ? focusedRowId : pageRows[0]?.id ?? null
//     const pageStartIndex = pageRows[0] ? matchingRows.findIndex((row) => row.id === pageRows[0].id) : -1
//     const pageEndIndex = pageStartIndex + pageRows.length - 1

//     const focusRowAt = (index: number) => {
//         if (matchingRows.length === 0) return
//         const clamped = Math.max(0, Math.min(matchingRows.length - 1, index))
//         const target = matchingRows[clamped]
//         setFocusedRowId(target.id)
//         setFocusRequest((n) => n + 1)
//         // Follow the row onto its page
//         if (!serverSidePagination) {
//             const page = Math.floor(clamped / currentPageSize) + 1
//             if (page !== pageNumber) goToPage(page)
//         }
//     }

//     // Move real focus once the row is rendered (it may be on a page that just loaded)
//     React.useEffect(() => {
//         if (focusRequest === 0 || !rovingRowId) return
//         const element = bodyScrollRef.current?.querySelector<HTMLElement>(
//             `tr[data-row-id="${CSS.escape(rovingRowId)}"]`
//         )
//         element?.focus({ preventScroll: true })
//         element?.scrollIntoView({ block: "nearest" })
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [focusRequest])

//     // Remember the drawer's row, so focus can return to it when the drawer closes
//     React.useEffect(() => {
//         if (detailsRowId) lastDetailsRowIdRef.current = detailsRowId
//     }, [detailsRowId])

//     const handleRowKeyDown = (
//         event: React.KeyboardEvent<HTMLTableRowElement>,
//         row: Row<DataTableFeatures, TData>
//     ) => {
//         // Keys pressed on a checkbox, button or menu inside the row keep their own behavior
//         if (event.target !== event.currentTarget) return
//         const index = matchingRows.findIndex((r) => r.id === row.id)
//         const canSelect = !!onRowSelect && row.getCanSelect()

//         switch (event.key) {
//             case "ArrowDown":
//             case "j": {
//                 event.preventDefault()
//                 if (event.shiftKey && canSelect) {
//                     row.toggleSelected(true)
//                     matchingRows[index + 1]?.toggleSelected(true)
//                 }
//                 focusRowAt(index + 1)
//                 break
//             }
//             case "ArrowUp":
//             case "k": {
//                 event.preventDefault()
//                 if (event.shiftKey && canSelect) {
//                     row.toggleSelected(true)
//                     matchingRows[index - 1]?.toggleSelected(true)
//                 }
//                 focusRowAt(index - 1)
//                 break
//             }
//             case "Home":
//                 event.preventDefault()
//                 focusRowAt(pageStartIndex)
//                 break
//             case "End":
//                 event.preventDefault()
//                 focusRowAt(pageEndIndex)
//                 break
//             case "PageDown":
//                 event.preventDefault()
//                 focusRowAt(index + currentPageSize)
//                 break
//             case "PageUp":
//                 event.preventDefault()
//                 focusRowAt(index - currentPageSize)
//                 break
//             case " ":
//                 if (canSelect) {
//                     event.preventDefault() // don't scroll the page
//                     row.toggleSelected()
//                 }
//                 break
//             case "Enter":
//                 if (renderDetails) {
//                     event.preventDefault()
//                     setDetailsRowId(row.id)
//                 }
//                 break
//         }
//     }

//     // Page-wide shortcuts: "/" focuses the search, "?" shows the shortcut list
//     React.useEffect(() => {
//         if (!enableKeyboardShortcuts) return
//         const onKeyDown = (event: KeyboardEvent) => {
//             if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
//             const target = event.target as HTMLElement | null
//             // Typing somewhere, or a dialog/menu is open: leave the keys alone
//             if (target?.closest("input, textarea, select, [contenteditable='true']")) return
//             if (document.querySelector("[role='dialog'][data-state='open'], [role='menu'][data-state='open']")) return

//             if (event.key === "/" && searchInputRef.current) {
//                 event.preventDefault()
//                 searchInputRef.current.focus()
//                 searchInputRef.current.select()
//             } else if (event.key === "?") {
//                 event.preventDefault()
//                 setShortcutsOpen(true)
//             }
//         }
//         document.addEventListener("keydown", onKeyDown)
//         return () => document.removeEventListener("keydown", onKeyDown)
//     }, [enableKeyboardShortcuts])


//     // During a drag only the column widths change, so reuse the last rendered rows.
//     // React skips an element it has already rendered, and the browser resizes the
//     // cells through the <colgroup>, so dragging stays smooth on large pages.
//     const bodyRowsRef = React.useRef<React.ReactNode>(null)

//     const renderBodyRows = () => {
//         return (showSkeleton ? (
//             Array.from({ length: skeletonCount }, (_, rowIndex) => (
//                 <TableRow key={`skeleton-${rowIndex}`} data-skeleton="" aria-hidden="true">
//                     {visibleLeafColumns.map((column, colIndex) => {
//                         const sticky = getSticky(column.id)
//                         return (
//                             <TableCell
//                                 key={column.id}
//                                 data-sticky={sticky.side}
//                                 data-sticky-edge={sticky.edge}
//                                 className={`${cellPaddingClass(column.id)} h-13 py-1.5`}
//                                 style={sticky.style}
//                             >
//                                 <SkeletonCellContent
//                                     columnId={column.id}
//                                     variant={column.columnDef.meta?.skeleton}
//                                     row={rowIndex}
//                                     col={colIndex}
//                                 />
//                             </TableCell>
//                         )
//                     })}
//                 </TableRow>
//             ))
//         ) : showErrorState ? (
//             <TableRow className="hover:bg-transparent">
//                 <TableCell colSpan={visibleLeafColumns.length} className="p-0">
//                     {/* Centered within the visible area, even when the table is wider */}
//                     <div className="sticky left-0 py-10" style={{ width: "var(--dt-body-width, 100%)" }}>
//                         <ErrorState message={describeError(error)} onRetry={retry} isRetrying={isRefreshing} />
//                     </div>
//                 </TableCell>
//             </TableRow>
//         ) : table.getRowModel().rows?.length ? (
//             table.getRowModel().rows.map((row) => (
//                 <TableRow
//                     key={row.id}
//                     data-row-id={row.id}
//                     data-state={row.getIsSelected() && "selected"}
//                     data-active={row.id === detailsRowId || undefined}
//                     tabIndex={row.id === rovingRowId ? 0 : -1}
//                     onFocus={(event) => {
//                         if (event.target === event.currentTarget) setFocusedRowId(row.id)
//                     }}
//                     onKeyDown={(event) => handleRowKeyDown(event, row)}
//                     onClick={(event) => handleRowClick(event, row.id)}
//                     className={cn(
//                         "group outline-none hover:bg-transparent data-[state=selected]:bg-transparent",
//                         renderDetails && "cursor-pointer"
//                     )}
//                 >
//                     {row.getVisibleCells().map((cell) => {
//                         const sticky = getSticky(cell.column.id)
//                         const meta = cell.column.columnDef.meta
//                         const content = flexRender(
//                             cell.column.columnDef.cell,
//                             cell.getContext()
//                         )
//                         const copyText = resolveCopyText(
//                             meta?.copyable,
//                             cell.getValue(),
//                             row.original
//                         )
//                         const copyLabel =
//                             (typeof meta?.copyable === "object" && meta.copyable.label) ||
//                             meta?.displayName?.toLowerCase() ||
//                             "value"
//                         return (
//                             <TableCell
//                                 key={cell.id}
//                                 data-sticky={sticky.side}
//                                 data-sticky-edge={sticky.edge}
//                                 className={`${cellPaddingClass(cell.column.id)} py-1.5 whitespace-normal`}
//                                 style={sticky.style}
//                             >
//                                 {copyText ? (
//                                     <CopyableCell text={copyText} label={copyLabel}>
//                                         {content}
//                                     </CopyableCell>
//                                 ) : (
//                                     content
//                                 )}
//                             </TableCell>
//                         )
//                     })}
//                 </TableRow>
//             ))
//         ) : (
//             <TableRow>
//                 <TableCell colSpan={visibleLeafColumns.length} className="p-0">
//                     <div
//                         className="sticky left-0 flex min-h-24 items-center justify-center py-6 text-center"
//                         style={{ width: "var(--dt-body-width, 100%)" }}
//                     >
//                         {columnFilters.length > 0 || globalFilter ? (
//                             <div className="space-y-2">
//                                 <p className="text-sm text-muted-foreground">No rows match your search or filters.</p>
//                                 <Button
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => {
//                                         table.setColumnFilters([])
//                                         clearSearch()
//                                     }}
//                                 >
//                                     Clear filters
//                                 </Button>
//                             </div>
//                         ) : (
//                             emptyState ?? <p className="text-sm text-muted-foreground">No results.</p>
//                         )}
//                     </div>
//                 </TableCell>
//             </TableRow>
//         ))
//     }

//     const bodyRows = isResizing && bodyRowsRef.current ? bodyRowsRef.current : renderBodyRows()
//     bodyRowsRef.current = bodyRows

//     return (
//         <div className="w-full space-y-4 min-w-0">
//             {/* Header */}
//             {(title || description) && (
//                 <div className="flex items-center space-x-2">
//                     {Icon && <Icon className="h-6 w-6 shrink-0" />}
//                     <div className="min-w-0 flex-1">
//                         {title && <h2 className="text-2xl font-bold tracking-tight truncate">{title}</h2>}
//                         {description && <p className="text-muted-foreground truncate">{description}</p>}
//                     </div>
//                 </div>
//             )}

//             {/* Toolbar */}
//             <div
//                 ref={toolbarRef}
//                 className={`flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-4 ${stickyToolbar ? "sticky z-10 bg-layout dark:bg-transparent" : ""
//                     }`}
//                 style={stickyToolbar ? { top: stickyOffset } : undefined}
//             >
//                 <div className="flex flex-1 items-center gap-2">
//                     {viewsEnabled && (
//                         <DataTableViews
//                             views={views}
//                             activeViewId={activeViewId}
//                             defaultViewName={defaultViewName ?? (title ? `All ${title.toLowerCase()}` : "All rows")}
//                             isModified={isViewModified}
//                             onSelect={selectView}
//                             onSaveNew={saveNewView}
//                             onUpdate={updateActiveView}
//                             onRename={renameActiveView}
//                             onDelete={deleteActiveView}
//                         />
//                     )}

//                     {/* Search */}
//                     {searchColumnIds.length > 0 && (
//                         <div className="relative flex-1 max-w-xs">
//                             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                             <Input
//                                 ref={searchInputRef}
//                                 type="search"
//                                 placeholder={searchPlaceholder}
//                                 value={searchInput}
//                                 onChange={(event) => setSearchInput(event.target.value)}
//                                 onKeyDown={(event) => {
//                                     if (event.key === "Escape") clearSearch()
//                                     if (event.key === "ArrowDown" && pageStartIndex >= 0) {
//                                         event.preventDefault()
//                                         focusRowAt(pageStartIndex)
//                                     }
//                                 }}
//                                 className="w-full pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
//                                 aria-label={searchPlaceholder}
//                             />
//                             {searchInput && (
//                                 <button
//                                     type="button"
//                                     onClick={clearSearch}
//                                     aria-label="Clear search"
//                                     className="absolute right-2 top-2.5 rounded text-muted-foreground hover:text-foreground"
//                                 >
//                                     <X className="h-4 w-4" />
//                                 </button>
//                             )}
//                         </div>
//                     )}

//                     {/* Bulk actions */}
//                     {selectedItems && selectedItems.length > 0 && onBulkDelete && (
//                         <Button
//                             variant="destructive"
//                             size="sm"
//                             onClick={onBulkDelete}
//                             className="ml-2"
//                         >
//                             <Trash2 className="mr-2 h-4 w-4" />
//                             <span className="hidden sm:inline">Delete</span>
//                             <span className="sm:hidden">Del</span> ({selectedItems.length})
//                         </Button>
//                     )}
//                 </div>

//                 <div className="flex items-center gap-2">
//                     {/* Filters */}
//                     <DataTableFilters table={table} view={filtersView} onViewChange={setFiltersView} />

//                     {enableExport && (
//                         <DataTableExport
//                             table={table}
//                             filename={exportFilename ?? title ?? "export"}
//                             isFiltered={columnFilters.length > 0 || !!globalFilter}
//                             isServerMode={serverSidePagination}
//                             onExportAll={onExportAll}
//                         />
//                     )}

//                     {/* Refresh button */}
//                     {onRefresh && (
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={onRefresh}
//                             disabled={isRefreshing}
//                             aria-busy={isRefreshing}
//                             className="shrink-0"
//                         >
//                             <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
//                             <span className="hidden sm:inline ml-2">
//                                 {isRefreshing ? 'Refreshing...' : 'Refresh'}
//                             </span>
//                         </Button>
//                     )}

//                     {/* Column visibility */}
//                     <ColumnSettingsDialog
//                         table={table}
//                         order={orderedMovableIds}
//                         onOrderChange={setMovableOrder}
//                         onReset={resetColumns}
//                         isDefault={isDefaultColumns}
//                     />
//                 </div>
//             </div>

//             {/* Active filters */}
//             <ActiveFilterChips
//                 table={table}
//                 search={globalFilter}
//                 onClearSearch={clearSearch}
//                 onEditSearch={() => searchInputRef.current?.focus()}
//                 onEditFilter={(columnId) => setFiltersView({ open: true, columnId })}
//             />

//             {/* Announces loading/refreshing to screen readers */}
//             <div className="sr-only" role="status" aria-live="polite">
//                 {statusMessage}
//             </div>

//             {/* A refresh failed, but older rows are still shown */}
//             {showStaleBanner && (
//                 <div
//                     role="alert"
//                     className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
//                 >
//                     <AlertCircle className="size-4 shrink-0 text-destructive" />
//                     <span className="min-w-0 flex-1">
//                         <span className="font-medium text-destructive">Couldn’t refresh.</span>{" "}
//                         <span className="text-muted-foreground">Showing the last loaded data.</span>
//                     </span>
//                     {retry && (
//                         <Button variant="outline" size="sm" onClick={retry} disabled={isRefreshing} className="shrink-0">
//                             {isRefreshing ? "Retrying…" : "Retry"}
//                         </Button>
//                     )}
//                 </div>
//             )}

//             {/* Selection bar */}
//             {onRowSelect && totalSelected > 0 && (
//                 <div
//                     role="region"
//                     aria-label="Row selection"
//                     className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-muted/40 px-3 py-2 text-sm"
//                 >
//                     <span className="font-medium tabular-nums">{selectedRowCount} selected</span>

//                     {selectedRowCount > 0 && (
//                         <span className="text-muted-foreground">
//                             {otherSelectedPages.length === 0 ? (
//                                 "all on this page"
//                             ) : (
//                                 <>
//                                     {selectedOnThisPage} on this page, {selectedRowCount - selectedOnThisPage} on{" "}
//                                     {otherSelectedPages.length === 1 ? "page" : "pages"}{" "}
//                                     {otherSelectedPages.slice(0, 5).map((page, index) => (
//                                         <React.Fragment key={page}>
//                                             {index > 0 && ", "}
//                                             <button
//                                                 type="button"
//                                                 onClick={() => goToPage(page)}
//                                                 className="rounded font-medium text-foreground underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                                                 aria-label={`Go to page ${page} (${selectedByPage.get(page)} selected)`}
//                                             >
//                                                 {page}
//                                             </button>
//                                         </React.Fragment>
//                                     ))}
//                                     {otherSelectedPages.length > 5 && ` and ${otherSelectedPages.length - 5} more`}
//                                 </>
//                             )}
//                         </span>
//                     )}

//                     {canSelectAllMatching && (
//                         <button
//                             type="button"
//                             onClick={selectAllMatching}
//                             className="rounded font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                         >
//                             Select all {matchingRows.length}
//                         </button>
//                     )}

//                     {hiddenSelectedCount > 0 && (
//                         <span className="text-muted-foreground">
//                             {hiddenSelectedCount} more hidden by filters (not included)
//                         </span>
//                     )}

//                     <button
//                         type="button"
//                         onClick={() => table.resetRowSelection(true)}
//                         className="ml-auto rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                     >
//                         Clear selection
//                     </button>
//                 </div>
//             )}

//             {/* Desktop Table */}
//             <div className="hidden md:block mb-2 w-full min-w-0">
//                 <div
//                     ref={tableWrapperRef}
//                     data-grid={cellBorders || undefined}
//                     data-resizing={isResizing || undefined}
//                     aria-busy={isLoading || isRefreshing || undefined}
//                     className="data-table relative isolate"
//                     style={stickyHeader ? ({ "--dt-sticky-top": `${headerTop}px` } as React.CSSProperties) : undefined}
//                 >
//                     {isRefreshing && hasData && <div className="data-table-progress" aria-hidden="true" />}

//                     <div
//                         ref={headScrollRef}
//                         onScroll={syncFrom}
//                         className={`data-table-head relative flex overflow-x-auto rounded-t-md border-x border-t ${stickyHeader ? "sticky z-5" : ""}`}
//                         style={stickyHeader ? { top: headerTop } : undefined}
//                     >
//                         <table className="shrink-0 table-fixed border-separate border-spacing-0 caption-bottom text-sm" style={headTableStyle}>
//                             {colGroup}
//                             <TableHeader>
//                                 {table.getHeaderGroups().map((headerGroup) => (
//                                     <TableRow key={headerGroup.id} className="hover:bg-transparent">
//                                         {headerGroup.headers.map((header) => {
//                                             const sticky = getSticky(header.column.id, true)
//                                             const column = header.column
//                                             const label =
//                                                 column.columnDef.meta?.displayName ||
//                                                 (typeof column.columnDef.header === "string" ? column.columnDef.header : column.id)
//                                             const resizeHandler = header.getResizeHandler()

//                                             return (
//                                                 <TableHead
//                                                     key={header.id}
//                                                     data-column-id={column.id}
//                                                     data-sticky={sticky.side}
//                                                     data-sticky-edge={sticky.edge}
//                                                     className={`${cellPaddingClass(column.id)} relative py-1.5 font-medium text-[13px] whitespace-nowrap`}
//                                                     style={sticky.style}
//                                                 >
//                                                     {header.isPlaceholder
//                                                         ? null
//                                                         : flexRender(column.columnDef.header, header.getContext())}

//                                                     {column.getCanResize() && (
//                                                         <div
//                                                             role="separator"
//                                                             aria-orientation="vertical"
//                                                             aria-label={`Resize ${label} column`}
//                                                             aria-valuenow={Math.round(column.getSize())}
//                                                             aria-valuemin={column.columnDef.minSize ?? 40}
//                                                             aria-valuemax={column.columnDef.maxSize ?? 1000}
//                                                             tabIndex={0}
//                                                             title="Drag to resize, double-click to reset"
//                                                             onMouseDown={resizeHandler}
//                                                             onTouchStart={resizeHandler}
//                                                             onDoubleClick={() => column.resetSize()}
//                                                             onClick={(event) => event.stopPropagation()}
//                                                             onKeyDown={(event) => {
//                                                                 const step = event.shiftKey ? 50 : 10
//                                                                 if (event.key === "ArrowLeft") {
//                                                                     event.preventDefault()
//                                                                     resizeBy(column.id, -step)
//                                                                 } else if (event.key === "ArrowRight") {
//                                                                     event.preventDefault()
//                                                                     resizeBy(column.id, step)
//                                                                 }
//                                                             }}
//                                                             className={cn("data-table-resizer", column.getIsResizing() && "is-resizing")}
//                                                         />
//                                                     )}
//                                                 </TableHead>
//                                             )
//                                         })}
//                                     </TableRow>
//                                 ))}
//                             </TableHeader>
//                         </table>
//                         <div aria-hidden="true" className="data-table-gutter" />
//                     </div>

//                     {/* Body */}
//                     <div
//                         ref={bodyScrollRef}
//                         onScroll={syncFrom}
//                         className="data-table-body relative overflow-x-hidden overflow-y-auto border-x"
//                         style={maxBodyHeight != null ? { maxHeight: maxBodyHeight } : undefined}
//                     >
//                         <table className="table-fixed border-separate border-spacing-0 caption-bottom text-sm" style={tableStyle}>
//                             {colGroup}
//                             <TableBody>{bodyRows}</TableBody>
//                         </table>
//                     </div>

//                     <div
//                         ref={scrollbarRef}
//                         onScroll={syncFrom}
//                         className="data-table-scrollbar overflow-x-auto overflow-y-hidden rounded-b-md border-x border-b"
//                     >
//                         <div ref={scrollbarInnerRef} style={{ height: 1 }} />
//                     </div>
//                 </div>
//             </div>

//             {/* Mobile Cards */}
//             <div className="md:hidden">
//                 {showSkeleton ? (
//                     Array.from({ length: 3 }, (_, index) => (
//                         <Card key={index} className="mb-4" aria-hidden="true">
//                             <CardHeader className="space-y-2">
//                                 <div className="flex items-center gap-3">
//                                     <SkeletonBar className="size-10 rounded-full" />
//                                     <div className="flex-1 space-y-2">
//                                         <SkeletonBar className="h-4 w-2/5" />
//                                         <SkeletonBar className="h-3 w-3/5" />
//                                     </div>
//                                 </div>
//                             </CardHeader>
//                         </Card>
//                     ))
//                 ) : showErrorState ? (
//                     <Card>
//                         <CardContent className="py-8">
//                             <ErrorState message={describeError(error)} onRetry={retry} isRetrying={isRefreshing} />
//                         </CardContent>
//                     </Card>
//                 ) : table.getRowModel().rows?.length ? (
//                     table.getRowModel().rows.map((row) => renderMobileCard(row))
//                 ) : (
//                     <Card>
//                         <CardContent className="py-6 text-center text-muted-foreground">
//                             {emptyState ?? "No results."}
//                         </CardContent>
//                     </Card>
//                 )}
//             </div>

//             {/* Pagination */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground sm:justify-start">
//                     <span>
//                         {showSkeleton
//                             ? "Loading…"
//                             : showErrorState
//                                 ? ""
//                                 : totalCount === 0
//                                     ? "No results"
//                                     : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
//                     </span>
//                     {enableKeyboardShortcuts && (
//                         <button
//                             type="button"
//                             onClick={() => setShortcutsOpen(true)}
//                             className="hidden items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
//                         >
//                             <Keyboard className="size-3.5" />
//                             Shortcuts
//                         </button>
//                     )}
//                 </div>

//                 {pageCount > 1 && !showSkeleton && !showErrorState && (
//                     <Pagination className="mx-0 w-auto">
//                         <PaginationContent>
//                             <PaginationItem>
//                                 <PaginationPrevious size={'xs'}  {...pageLinkProps(pageNumber - 1, canPreviousPage)} />
//                             </PaginationItem>

//                             {canJumpToPage ? (
//                                 getPageItems(pageNumber, pageCount).map((item) =>
//                                     typeof item === "number" ? (
//                                         <PaginationItem key={item}>
//                                             <PaginationLink
//                                                 {...pageLinkProps(item)}
//                                                 isActive={item === pageNumber}
//                                                 aria-label={`Page ${item}`}
//                                                 size="sm"
//                                                 className="bg-accent text-accent-foreground aria-[current=page]:bg-accent-foreground aria-[current=page]:text-accent aria-[current=page]:hover:bg-accent-foreground/90"
//                                             >
//                                                 {item}
//                                             </PaginationLink>
//                                         </PaginationItem>
//                                     ) : (
//                                         <PaginationItem key={item}>
//                                             <PaginationEllipsis />
//                                         </PaginationItem>
//                                     )
//                                 )
//                             ) : (
//                                 <PaginationItem>
//                                     <span className="px-2 text-xs text-muted-foreground">
//                                         Page {pageNumber} of {pageCount}
//                                     </span>
//                                 </PaginationItem>
//                             )}

//                             <PaginationItem>
//                                 <PaginationNext size={'xs'}  {...pageLinkProps(pageNumber + 1, canNextPage)} />
//                             </PaginationItem>
//                         </PaginationContent>
//                     </Pagination>
//                 )}

//                 {canChangePageSize && (
//                     <Field orientation="horizontal" className="w-fit">
//                         <FieldLabel htmlFor="data-table-page-size" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
//                             Rows per page
//                         </FieldLabel>
//                         <Select
//                             value={String(currentPageSize)}
//                             onValueChange={(value) => changePageSize(Number(value))}
//                         >
//                             <SelectTrigger size="sm" className="w-20" id="data-table-page-size">
//                                 <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent align="end" position="popper">
//                                 <SelectGroup>
//                                     {sizeChoices.map((size) => (
//                                         <SelectItem key={size} value={String(size)}>
//                                             {size}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectGroup>
//                             </SelectContent>
//                         </Select>
//                     </Field>
//                 )}
//             </div>

//             {/* Details drawer */}
//             {renderDetails && (
//                 <Sheet
//                     open={!!detailsRow}
//                     onOpenChange={(open) => {
//                         if (!open) setDetailsRowId(null)
//                     }}
//                 >
//                     <SheetContent
//                         side="right"
//                         className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
//                         onCloseAutoFocus={(event) => {
//                             // Radix would focus <body> (the drawer had no trigger button); go back to the row instead
//                             const rowId = lastDetailsRowIdRef.current
//                             if (!rowId) return
//                             event.preventDefault()
//                             setFocusedRowId(rowId)
//                             setFocusRequest((n) => n + 1)
//                         }}

//                         // ↑/↓ step through rows, except while typing or inside a menu
//                         onKeyDown={(event) => {
//                             const target = event.target as HTMLElement
//                             if (target.closest("input, textarea, select, [contenteditable='true'], [role='menu'], [role='listbox']")) return
//                             if (event.key === "ArrowDown") {
//                                 event.preventDefault()
//                                 stepDetails(1)
//                             } else if (event.key === "ArrowUp") {
//                                 event.preventDefault()
//                                 stepDetails(-1)
//                             }
//                         }}
//                     >
//                         {detailsRow && (
//                             <>
//                                 <SheetHeader className="space-y-1 border-b px-5 py-4 pr-12 text-left">
//                                     <div className="flex items-center gap-2">
//                                         <span className="text-xs tabular-nums text-muted-foreground">
//                                             {detailsIndex + 1} of {matchingRows.length}
//                                         </span>
//                                         <div className="flex gap-1">
//                                             <Button
//                                                 variant="outline"
//                                                 size="icon"
//                                                 className="size-6"
//                                                 onClick={() => stepDetails(-1)}
//                                                 disabled={detailsIndex <= 0}
//                                                 aria-label="Previous row"
//                                                 title="Previous (↑)"
//                                             >
//                                                 <ChevronUp className="size-3.5" />
//                                             </Button>
//                                             <Button
//                                                 variant="outline"
//                                                 size="icon"
//                                                 className="size-6"
//                                                 onClick={() => stepDetails(1)}
//                                                 disabled={detailsIndex >= matchingRows.length - 1}
//                                                 aria-label="Next row"
//                                                 title="Next (↓)"
//                                             >
//                                                 <ChevronDown className="size-3.5" />
//                                             </Button>
//                                         </div>
//                                     </div>
//                                     <SheetTitle className="truncate text-lg">
//                                         {getDetailsTitle?.(detailsRow.original) ?? "Details"}
//                                     </SheetTitle>
//                                     {getDetailsDescription ? (
//                                         <SheetDescription className="truncate">
//                                             {getDetailsDescription(detailsRow.original)}
//                                         </SheetDescription>
//                                     ) : (
//                                         <SheetDescription className="sr-only">Row details</SheetDescription>
//                                     )}
//                                 </SheetHeader>

//                                 <div className="scroll-thin flex-1 overflow-y-auto">
//                                     {renderDetails(detailsRow.original)}
//                                 </div>
//                             </>
//                         )}
//                     </SheetContent>
//                 </Sheet>
//             )}

//             {enableKeyboardShortcuts && <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />}
//         </div>
//     )
// }

// // Helper function to create sortable column header
// export function createSortableHeader<TData extends RowData>(
//     title: string,
// ): ColumnDef<TData, unknown>["header"] {
//     const SortableHeader = ({ column }: { column: Column<DataTableFeatures, TData, unknown> }) => {
//         const sorted = column.getIsSorted()

//         // none → asc → desc → none
//         const cycleSorting = () => {
//             if (sorted === false) column.toggleSorting(false)      // asc
//             else if (sorted === "asc") column.toggleSorting(true)  // desc
//             else column.clearSorting()                             // back to the loaded order
//         }

//         const nextLabel =
//             sorted === false ? "ascending" : sorted === "asc" ? "descending" : "unsorted"

//         return (
//             <Button
//                 variant="ghost"
//                 onClick={cycleSorting}
//                 aria-label={`Sort by ${title}, ${nextLabel}`}
//                 className="text-[13px] -ml-3 flex h-8 gap-2 px-3"
//             >
//                 <span>{title}</span>
//                 {sorted === "asc" ? (
//                     <appIcons.ascOrder />
//                 ) : sorted === "desc" ? (
//                     <appIcons.descOrder />
//                 ) : (
//                     <appIcons.arrowUpDown className="size-3.5 opacity-20" />
//                 )}
//             </Button>
//         )
//     }

//     SortableHeader.displayName = `SortableHeader-${title}`
//     return SortableHeader
// }