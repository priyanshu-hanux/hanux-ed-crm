import * as React from "react"
import {
    useTable,
    type PaginationState,
    type RowData,
    type RowSelectionState,
    type SortingState,
    type ColumnFiltersState,
    type ColumnSizingState,
} from "@tanstack/react-table"

import { TableBody } from "@/components/ui/table"

import "./styles/data-table.css"

import { DEFAULT_PAGE_SIZE_OPTIONS, MAX_SKELETON_ROWS } from "./config/constants"
import { dataTableFeatures } from "./config/features"
import { defaultGetRowId } from "./helpers/columns"
import { describeError } from "./helpers/errors"
import { exportRowsToCsv } from "./helpers/export-csv"
import { getSelectionSummary } from "./helpers/selection"
import { useColumnOrder } from "./hooks/use-column-order"
import { useColumnVisibility } from "./hooks/use-column-visibility"
import { useDetailsDrawer } from "./hooks/use-details-drawer"
import { useElementHeight } from "./hooks/use-element-height"
import { useFiltersChange } from "./hooks/use-filters-change"
import { useGlobalShortcuts } from "./hooks/use-global-shortcuts"
import { useInitialState } from "./hooks/use-initial-state"
import { useKeyboardNavigation } from "./hooks/use-keyboard-navigation"
import { useRovingFocus } from "./hooks/use-roving-focus"
import { useRowSelectionSync } from "./hooks/use-row-selection-sync"
import { useSavedViews } from "./hooks/use-saved-views"
import { useStickyColumns } from "./hooks/use-sticky-columns"
import { useStableCallback } from "./hooks/use-stable-callback"
import { useSyncedScroll } from "./hooks/use-synced-scroll"
import { useTableColumns } from "./hooks/use-table-columns"
import { useTableLayoutFlags } from "./hooks/use-table-layout-flags"
import { useTablePagination } from "./hooks/use-table-pagination"
import { useTablePersistence } from "./hooks/use-table-persistence"
import { useTableSearch } from "./hooks/use-table-search"
import { DetailsDrawer } from "./components/details/details-drawer"
import { MemoBlock } from "./components/memo-block"
import { KeyboardShortcutsDialog } from "./components/dialogs/keyboard-shortcuts-dialog"
import { ActiveFilterChips } from "./components/filters/active-filter-chips"
import { DataTableFilters } from "./components/filters/data-table-filters"
import { TableBodyRows } from "./components/grid/table-body-rows"
import { TableFrame } from "./components/grid/table-frame"
import { TableHeaderRows } from "./components/grid/table-header-rows"
import { MobileCardList } from "./components/mobile/mobile-card-list"
import { DataTablePagination } from "./components/pagination/data-table-pagination"
import { BulkActions } from "./components/selection/bulk-actions"
import { SelectionToolbar } from "./components/selection/selection-bar"
import { SelectionMenu } from "./components/selection/selection-menu"
import { StaleDataBanner } from "./components/states/stale-data-banner"
import { UTILITY_COLUMN_IDS } from "./config/constants"
import { getTableStateKind, resolveTableState, toItemName } from "./helpers/table-states"
import { ColumnSettingsDialog } from "./components/toolbar/column-settings-dialog"
import { DataTableViews } from "./components/toolbar/data-table-views"
import { TableSearch } from "./components/toolbar/table-search"
import { ToolbarActionButtons, ToolbarMoreMenu } from "./components/toolbar/toolbar-actions"
import { BulkDeleteButton } from "./components/toolbar/toolbar-buttons"
import type { DataTableBulkAction, DataTableSelectionPreset } from "./types/bulk-actions"
import type { DataTableAction, DataTableProps } from "./types/data-table"
import { useMediaQuery } from "./hooks/use-media-query"
import type { FilterView } from "./types/filters"
import type { DataTableToolbarAction } from "./types/toolbar"
import type { ViewState } from "./types/views"

/** Shared defaults so a table without them doesn't get a new [] (and rebuilt columns) every render */
const NO_ACTIONS: DataTableAction<never>[] = []
const NO_BULK_ACTIONS: DataTableBulkAction<never>[] = []
const NO_PRESETS: DataTableSelectionPreset<never>[] = []
const NO_TOOLBAR_ACTIONS: DataTableToolbarAction[] = []
const DEFAULT_ITEM_NAME = { singular: "item", plural: "items" }

export function DataTable<TData extends RowData, TValue>({
    columns,
    data,
    title,
    description,
    icon: Icon,
    searchKey,
    searchPlaceholder = "Search...",
    searchColumns,
    filterMode,
    onFiltersChange,
    persistKey,
    syncUrl = false,
    urlPrefix = "",
    actions = NO_ACTIONS as DataTableAction<TData>[],
    onRowSelect,
    bulkActions = NO_BULK_ACTIONS as DataTableBulkAction<TData>[],
    selectionPresets = NO_PRESETS as DataTableSelectionPreset<TData>[],
    toolbarActions = NO_TOOLBAR_ACTIONS,
    showEmptySelectionPresets = false,
    columnVisibility: externalColumnVisibility,
    onColumnVisibilityChange,
    defaultColumnVisibility,
    selectedItems = [],
    onBulkDelete,
    onRefresh,
    isRefreshing = false,
    isLoading = false,
    error,
    onRetry,
    emptyState,
    states,
    itemName,
    skeletonRows,
    getRowId,
    cardFields,
    stickyToolbar = true,
    stickyHeader = true,
    stickyOffset = 0,
    cellBorders = false,
    showHeaderIcons = true,
    maxBodyHeight,
    serverSidePagination = false,
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 10,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    onPreviousPage,
    onNextPage,
    onPageChange,
    onPageSizeChange,
    enableExport = true,
    exportFilename,
    onExportAll,
    renderDetails,
    getDetailsTitle,
    getDetailsDescription,
    detailsRowId: detailsRowIdProp,
    onDetailsRowIdChange,
    enableViews,
    defaultViewName,
    enableKeyboardShortcuts = true,
}: DataTableProps<TData, TValue>) {
    /* ------------------------------------------------------------------ */
    /* State                                                               */
    /* ------------------------------------------------------------------ */
    const { filterConfigs, stored, views, setViews, activeViewId, setActiveViewId, initial } = useInitialState({
        columns,
        persistKey,
        syncUrl,
        urlPrefix,
    })

    const [sorting, setSorting] = React.useState<SortingState>(initial.sorting)
    const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(initial.columnSizing)
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initial.columnFilters)
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
    const [filtersView, setFiltersView] = React.useState<FilterView>({ open: false, columnId: null })
    const [shortcutsOpen, setShortcutsOpen] = React.useState(false)

    const search = useTableSearch({ initialSearch: initial.search, searchColumns, searchKey })
    const { searchColumnIds, globalFilter, clearSearch, searchInputRef } = search

    const { columnVisibility, setColumnVisibility, defaultVisibility } = useColumnVisibility({
        columnVisibility: externalColumnVisibility,
        onColumnVisibilityChange,
        defaultColumnVisibility,
        storedVisibility: stored?.visibility,
    })

    const resolveRowId = React.useCallback(
        (row: TData, index: number) => (getRowId ? getRowId(row, index) : defaultGetRowId(row, index)),
        [getRowId]
    )

    const isServerFiltering = (filterMode ?? (serverSidePagination ? "server" : "client")) === "server"
    const isFiltered = columnFilters.length > 0 || !!globalFilter

    /* ------------------------------------------------------------------ */
    /* Columns: utility columns, order, reset                              */
    /* ------------------------------------------------------------------ */
    // Checkboxes appear when something uses the selection: onRowSelect, bulk actions or presets
    const selectable = !!onRowSelect || bulkActions.length > 0 || selectionPresets.length > 0
    const finalColumns = useTableColumns({ columns, selectable, actions })
    const { defaultMovableIds, movableOrder, setMovableOrder, resolveOrder, orderedMovableIds, columnOrder } =
        useColumnOrder({ columns: finalColumns, initialOrder: initial.order })

    // Header icons: the viewer's choice from the Columns dialog, else the showHeaderIcons prop.
    // undefined = no choice made, so a later change to the prop still applies.
    const [headerIconsChoice, setHeaderIconsChoice] = React.useState<boolean | undefined>(() => stored?.headerIcons)
    const headerIcons = headerIconsChoice ?? showHeaderIcons
    const setHeaderIcons = (on: boolean) => setHeaderIconsChoice(on === showHeaderIcons ? undefined : on)
    const hasColumnIcons = columns.some((column) => !!(column.meta as { icon?: unknown } | undefined)?.icon)

    const resetColumns = () => {
        setMovableOrder([])
        setColumnSizing({})
        setColumnVisibility(defaultVisibility)
        setHeaderIconsChoice(undefined)
    }

    /* ------------------------------------------------------------------ */
    /* Saved views                                                         */
    /* ------------------------------------------------------------------ */
    const viewsEnabled = enableViews ?? !!persistKey
    const currentViewState: ViewState = {
        search: globalFilter,
        columnFilters,
        sorting,
        order: movableOrder,
        visibility: columnVisibility,
        sizing: columnSizing,
    }
    const savedViews = useSavedViews({
        persistKey,
        views,
        setViews,
        activeViewId,
        setActiveViewId,
        current: currentViewState,
        columnOrder,
        resolveOrder,
        defaultVisibility,
        filterConfigs,
        setColumnFilters,
        setSearch: search.setSearchNow,
        setSorting,
        setMovableOrder,
        setColumnSizing,
        setColumnVisibility,
    })

    /* ------------------------------------------------------------------ */
    /* Table                                                               */
    /* ------------------------------------------------------------------ */
    // Client mode only: in server mode, the parent owns the page size
    const initialPageSize = !serverSidePagination && stored?.pageSize && pageSizeOptions.includes(stored.pageSize)
        ? stored.pageSize
        : pageSize

    const table = useTable({
        features: dataTableFeatures,
        data,
        columns: finalColumns,
        getRowId: resolveRowId,
        initialState: { pagination: { pageIndex: 0, pageSize: initialPageSize } },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: search.setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        globalFilterFn: search.globalSearchFn,
        getColumnCanGlobalFilter: (column) => column.id === searchColumnIds[0],
        manualFiltering: isServerFiltering,
        manualPagination: serverSidePagination,
        pageCount: serverSidePagination ? totalPages : undefined,
        columnResizeMode: "onChange",
        onColumnSizingChange: setColumnSizing,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            columnOrder,
            columnSizing,
            rowSelection,
            ...(serverSidePagination
                ? { pagination: { pageIndex: currentPage - 1, pageSize } satisfies PaginationState }
                : {}),
        },
    })

    /* ------------------------------------------------------------------ */
    /* Loading / error                                                     */
    /* ------------------------------------------------------------------ */
    const hasData = data.length > 0
    const showSkeleton = isLoading && !hasData
    const showErrorState = !!error && !hasData && !isLoading
    const showStaleBanner = !!error && hasData
    const retry = onRetry ?? onRefresh
    const errorMessage = showErrorState ? describeError(error) : undefined
    const skeletonCount =
        skeletonRows ?? Math.min(serverSidePagination ? pageSize : table.state.pagination.pageSize, MAX_SKELETON_ROWS)
    const statusMessage = showSkeleton ? "Loading…" : isRefreshing ? "Refreshing…" : ""

    /* ------------------------------------------------------------------ */
    /* Persistence, URL and filter changes                                 */
    /* ------------------------------------------------------------------ */
    useTablePersistence({
        persistKey,
        movableOrder,
        columnVisibility,
        sorting,
        columnSizing,
        pageSize: serverSidePagination ? undefined : table.state.pagination.pageSize,
        activeViewId,
        headerIcons: headerIconsChoice,
        syncUrl,
        urlPrefix,
        columnFilters,
        globalFilter,
        filterConfigs,
    })

    useFiltersChange({ table, columnFilters, globalFilter, isServerFiltering, onFiltersChange })

    // Columns missing from the visibility map count as visible, same as TanStack
    const isDefaultColumns =
        headerIconsChoice === undefined &&
        Object.keys(columnSizing).length === 0 &&
        orderedMovableIds.every((id, index) => id === defaultMovableIds[index]) &&
        table
            .getAllLeafColumns()
            .every((column) => (defaultVisibility[column.id] ?? true) === column.getIsVisible())

    /* ------------------------------------------------------------------ */
    /* Layout: sticky toolbar/header, scroll sync, pinned columns          */
    /* ------------------------------------------------------------------ */
    // Same breakpoint as Tailwind's md:, which shows the table and hides the cards
    const isDesktop = useMediaQuery("(min-width: 768px)")
    // Wide screens fit more bulk actions in the toolbar before the rest go into ⋯
    const isWide = useMediaQuery("(min-width: 1280px)")
    const toolbarRef = React.useRef<HTMLDivElement>(null)
    const toolbarHeight = useElementHeight(toolbarRef, stickyToolbar)
    const headerTop = stickyOffset + (stickyToolbar ? toolbarHeight : 0)

    const { headScrollRef, bodyScrollRef, scrollbarRef, scrollbarInnerRef, syncFrom } = useSyncedScroll()

    const tableWrapperRef = React.useRef<HTMLDivElement>(null)
    const { visibleLeafColumns, visibleColumnsKey, getSticky, stickyOffsets } = useStickyColumns({ table, wrapperRef: tableWrapperRef })
    const isResizing = visibleLeafColumns.some((column) => column.getIsResizing())

    useTableLayoutFlags({
        wrapperRef: tableWrapperRef,
        headRef: headScrollRef,
        bodyRef: bodyScrollRef,
        scrollbarInnerRef,
        stickyHeader,
        visibleColumnsKey,
        maxBodyHeight,
    })

    /* ------------------------------------------------------------------ */
    /* Selection                                                           */
    /* ------------------------------------------------------------------ */
    useRowSelectionSync({ table, data, resolveRowId, rowSelection, setRowSelection, onRowSelect })
    const selectedRowCount = table.getFilteredSelectedRowModel().rows.length

    /* ------------------------------------------------------------------ */
    /* Pagination                                                          */
    /* ------------------------------------------------------------------ */
    const pagination = useTablePagination({
        table,
        clientPagination: table.state.pagination,
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
    })
    const { pageNumber, goToPage } = pagination

    const matchingRows = table.getPrePaginatedRowModel().rows // filtered + sorted, all pages
    const selectionSummary = getSelectionSummary({
        matchingRows,
        rowSelection,
        selectedRowCount,
        pageNumber,
        pageSize: pagination.pageSize,
        serverSidePagination,
        isAllPageRowsSelected: table.getIsAllPageRowsSelected(),
    })

    // What bulk actions and presets work on: selected rows visible under the filters, and all matching rows
    const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
    const matchingData = React.useMemo(() => matchingRows.map((row) => row.original), [matchingRows])
    // Replace the selection with the matching rows a preset accepts (all pages)
    const selectWhere = (match: (row: TData) => boolean) => {
        const next: RowSelectionState = {}
        for (const row of matchingRows) if (row.getCanSelect() && match(row.original)) next[row.id] = true
        table.setRowSelection(next)
    }
    const selectAllMatching = () =>
        table.setRowSelection((prev) => {
            const next = { ...prev }
            for (const row of matchingRows) if (row.getCanSelect()) next[row.id] = true
            return next
        })

    /* ------------------------------------------------------------------ */
    /* Details drawer and keyboard navigation                              */
    /* ------------------------------------------------------------------ */
    const { focusedRowId, setFocusedRowId, focusRequest, requestFocus } = useRovingFocus()

    const details = useDetailsDrawer({
        detailsRowId: detailsRowIdProp,
        onDetailsRowIdChange,
        enabled: !!renderDetails,
        matchingRows,
        isLoading,
        bodyScrollRef,
        serverSidePagination,
        pageNumber,
        pageSize: pagination.pageSize,
        goToPage,
        setFocusedRowId,
        requestFocus,
    })

    const pageRows = table.getRowModel().rows
    const keyboard = useKeyboardNavigation({
        pageRows,
        matchingRows,
        focusedRowId,
        focusRequest,
        requestFocus,
        bodyScrollRef,
        serverSidePagination,
        pageNumber,
        pageSize: pagination.pageSize,
        goToPage,
        selectable,
        canOpenDetails: !!renderDetails,
        openDetails: details.setDetailsRowId,
    })

    useGlobalShortcuts({ enabled: enableKeyboardShortcuts, searchInputRef, setShortcutsOpen })

    /* ------------------------------------------------------------------ */
    /* What to show instead of rows: no data, no matches, error, no columns */
    /* ------------------------------------------------------------------ */
    const visibleDataColumnCount = visibleLeafColumns.filter((column) => !UTILITY_COLUMN_IDS.has(column.id)).length
    const stateKind = getTableStateKind({
        isLoading: showSkeleton,
        hasError: errorMessage !== undefined,
        rowCount: pageRows.length,
        isFiltered,
        visibleDataColumnCount,
    })
    const tableState = stateKind
        ? resolveTableState({
              kind: stateKind,
              // `emptyState` is the older way to set the "empty" state; `states.empty` wins
              states: emptyState !== undefined && states?.empty === undefined
                  ? { ...states, empty: React.isValidElement(emptyState) ? emptyState : { title: emptyState } }
                  : states,
              itemName: toItemName(itemName),
              search: globalFilter,
              filterCount: columnFilters.length,
              errorMessage,
              handlers: {
                  clearSearch,
                  clearFilters: () => table.setColumnFilters([]),
                  retry,
                  isRetrying: isRefreshing,
                  refresh: onRefresh,
                  showAllColumns: () => table.toggleAllColumnsVisible(true),
              },
          })
        : null

    /* ------------------------------------------------------------------ */
    /* Memoized parts                                                      */
    /* ------------------------------------------------------------------ */
    // The toolbar, header and pagination sit in <MemoBlock>s, so selecting a row (which only
    // changes the selection) doesn't re-render them. Their handlers are stable and always current.
    const stable = {
        selectView: useStableCallback(savedViews.selectView),
        saveNewView: useStableCallback(savedViews.saveNewView),
        updateActiveView: useStableCallback(savedViews.updateActiveView),
        renameActiveView: useStableCallback(savedViews.renameActiveView),
        deleteActiveView: useStableCallback(savedViews.deleteActiveView),
        setSearchInput: useStableCallback(search.setSearchInput),
        clearSearch: useStableCallback(clearSearch),
        focusFirstRow: useStableCallback(keyboard.focusFirstRowOnPage),
        editSearch: useStableCallback(() => searchInputRef.current?.focus()),
        editFilter: useStableCallback((columnId: string) => setFiltersView({ open: true, columnId })),
        setMovableOrder: useStableCallback(setMovableOrder),
        resetColumns: useStableCallback(resetColumns),
        setHeaderIcons: useStableCallback(setHeaderIcons),
        goToPage: useStableCallback(pagination.goToPage),
        changePageSize: useStableCallback(pagination.changePageSize),
        showShortcuts: useStableCallback(() => setShortcutsOpen(true)),
        exportAll: useStableCallback(() => {
            if (serverSidePagination && onExportAll) onExportAll()
            else exportRowsToCsv(table, table.getPrePaginatedRowModel().rows, exportFilename ?? title ?? "export")
        }),
    }
    const stablePagination = { ...pagination, goToPage: stable.goToPage, changePageSize: stable.changePageSize }
    // The header's select-all checkbox is the only part of the header that follows the selection
    const headerSelection = table.getIsAllPageRowsSelected() ? "all" : table.getIsSomePageRowsSelected() ? "some" : "none"
    const viewName = defaultViewName ?? (title ? `All ${title.toLowerCase()}` : "All rows")
    const selecting = selectable && selectionSummary.totalSelected > 0
    const exportName = exportFilename ?? title ?? "export"
    // "⋯ → Export" downloads the whole list: every row matching the search and filters, on all pages.
    // Selected rows are exported from the selection toolbar instead. In server mode the table only
    // has the current page, so it uses onExportAll when given (your API builds the file).
    const serverExportAll = serverSidePagination && !!onExportAll
    const exportLabel = !enableExport
        ? undefined
        : serverSidePagination
          ? serverExportAll
              ? "Export all to CSV"
              : "Export this page to CSV"
          : isFiltered
            ? "Export filtered rows to CSV"
            : "Export all to CSV"
    const exportCount = serverExportAll ? undefined : matchingRows.length

    /* ------------------------------------------------------------------ */
    /* Render                                                             */
    /* ------------------------------------------------------------------ */
    return (
        <div className="w-full space-y-4 min-w-0">
            {/* Header */}
            {(title || description) && (
                <div className="flex items-center space-x-2">
                    {Icon && <Icon className="h-6 w-6 shrink-0" />}
                    <div className="min-w-0 flex-1">
                        {title && (
                            <div className="flex min-w-0 items-center gap-2.5">
                                <h2 className="truncate text-2xl font-bold tracking-tight">{title}</h2>
                                {!showSkeleton && !showErrorState && (
                                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                                        {serverSidePagination ? totalItems : data.length}
                                    </span>
                                )}
                            </div>
                        )}
                        {description && <p className="text-muted-foreground truncate">{description}</p>}
                    </div>
                </div>
            )}

            {/* Toolbar: the normal tools, or the selection's actions in the same place while rows are selected */}
            <div
                ref={toolbarRef}
                className={stickyToolbar ? "sticky z-10 bg-layout dark:bg-transparent" : undefined}
                style={stickyToolbar ? { top: stickyOffset } : undefined}
            >
                <div
                    data-selecting={selecting || undefined}
                    className="group/toolbar grid rounded-xl border bg-card transition-colors duration-200 ease-(--ease-smooth) data-selecting:border-(--dt-accent)/30 data-selecting:bg-(--dt-accent)/[0.06] dark:data-selecting:bg-(--dt-accent)/10"
                >
                    <div
                        inert={selecting}
                        className="col-start-1 row-start-1 flex min-w-0 flex-wrap items-center gap-2 p-2 transition-[opacity,translate,visibility] duration-200 ease-(--ease-smooth) group-data-selecting/toolbar:invisible group-data-selecting/toolbar:-translate-y-1 group-data-selecting/toolbar:opacity-0"
                    >
                        {/* On phones its items join the toolbar's own rows: views, filter, select, then search beside the tools */}
                        <div className="flex min-w-0 flex-1 items-center gap-2 max-sm:contents">
                            {viewsEnabled && (
                                <>
                                    <MemoBlock deps={[views, activeViewId, viewName, savedViews.isModified]}>
                                        <DataTableViews
                                            views={views}
                                            activeViewId={activeViewId}
                                            defaultViewName={viewName}
                                            isModified={savedViews.isModified}
                                            onSelect={stable.selectView}
                                            onSaveNew={stable.saveNewView}
                                            onUpdate={stable.updateActiveView}
                                            onRename={stable.renameActiveView}
                                            onDelete={stable.deleteActiveView}
                                        />
                                    </MemoBlock>
                                    <div className="h-6 w-px shrink-0 bg-border max-sm:hidden" aria-hidden="true" />
                                </>
                            )}

                            {searchColumnIds.length > 0 && (
                                <MemoBlock deps={[search.searchInput, searchPlaceholder, enableKeyboardShortcuts]}>
                                    <TableSearch
                                        inputRef={searchInputRef}
                                        value={search.searchInput}
                                        placeholder={searchPlaceholder}
                                        onChange={stable.setSearchInput}
                                        onClear={stable.clearSearch}
                                        onArrowDown={stable.focusFirstRow}
                                        shortcut={enableKeyboardShortcuts ? "/" : undefined}
                                    />
                                </MemoBlock>
                            )}

                            <MemoBlock deps={[finalColumns, data, columnFilters, globalFilter, filtersView]}>
                                <DataTableFilters table={table} view={filtersView} onViewChange={setFiltersView} />
                            </MemoBlock>

                            {selectable && (
                                <SelectionMenu
                                    presets={selectionPresets}
                                    matchingRows={matchingData}
                                    pageRowCount={pageRows.filter((row) => row.getCanSelect()).length}
                                    selectedCount={selectionSummary.totalSelected}
                                    onSelectPage={() => table.toggleAllPageRowsSelected(true)}
                                    onSelectAllMatching={selectAllMatching}
                                    onSelectWhere={selectWhere}
                                    onClear={() => table.resetRowSelection(true)}
                                    showEmpty={showEmptySelectionPresets}
                                />
                            )}

                            {selectedItems && selectedItems.length > 0 && onBulkDelete && (
                                <BulkDeleteButton count={selectedItems.length} onDelete={onBulkDelete} />
                            )}
                        </div>

                        <div className="ml-auto flex items-center gap-1 max-sm:order-2">
                            <MemoBlock deps={[toolbarActions]}>
                                <ToolbarActionButtons actions={toolbarActions} />
                            </MemoBlock>

                            <MemoBlock
                                deps={[finalColumns, columnVisibility, orderedMovableIds, isDefaultColumns, hasColumnIcons, headerIcons]}
                            >
                                <ColumnSettingsDialog
                                    table={table}
                                    order={orderedMovableIds}
                                    onOrderChange={stable.setMovableOrder}
                                    onReset={stable.resetColumns}
                                    isDefault={isDefaultColumns}
                                    // Only offered when at least one column has an icon
                                    headerIcons={hasColumnIcons ? headerIcons : undefined}
                                    onHeaderIconsChange={stable.setHeaderIcons}
                                />
                            </MemoBlock>

                            {/* Refresh, Export and your own actions; anything not placed in the toolbar lands here */}
                            <MemoBlock deps={[toolbarActions, onRefresh, isRefreshing, exportLabel, exportCount]}>
                                <ToolbarMoreMenu
                                    actions={toolbarActions}
                                    onRefresh={onRefresh}
                                    isRefreshing={isRefreshing}
                                    exportItem={
                                        exportLabel ? { label: exportLabel, count: exportCount, onSelect: stable.exportAll } : undefined
                                    }
                                />
                            </MemoBlock>
                        </div>
                    </div>

                    {selectable && (
                        <div
                            inert={!selecting}
                            className="invisible col-start-1 row-start-1 flex min-w-0 translate-y-1 items-center opacity-0 transition-[opacity,translate,visibility] duration-200 ease-(--ease-smooth) group-data-selecting/toolbar:visible group-data-selecting/toolbar:translate-y-0 group-data-selecting/toolbar:opacity-100"
                        >
                            <SelectionToolbar
                                show={selecting}
                                selectedRowCount={selectedRowCount}
                                summary={selectionSummary}
                                matchingRowCount={matchingRows.length}
                                onGoToPage={goToPage}
                                onSelectAllMatching={selectAllMatching}
                                onClear={() => table.resetRowSelection(true)}
                                actions={
                                    bulkActions.length > 0 && (
                                        <BulkActions
                                            actions={bulkActions}
                                            rows={selectedRows}
                                            itemName={toItemName(itemName) ?? DEFAULT_ITEM_NAME}
                                            clearSelection={() => table.resetRowSelection(true)}
                                            exportCsv={() =>
                                                exportRowsToCsv(table, table.getFilteredSelectedRowModel().rows, exportName)
                                            }
                                            maxVisible={isWide ? 5 : isDesktop ? 3 : 1}
                                        />
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            </div>

            <MemoBlock deps={[finalColumns, columnFilters, globalFilter]}>
                <ActiveFilterChips
                    table={table}
                    search={globalFilter}
                    onClearSearch={stable.clearSearch}
                    onEditSearch={stable.editSearch}
                    onEditFilter={stable.editFilter}
                />
            </MemoBlock>

            {/* Announces loading/refreshing to screen readers */}
            <div className="sr-only" role="status" aria-live="polite">
                {statusMessage}
            </div>

            {showStaleBanner && <StaleDataBanner onRetry={retry} isRetrying={isRefreshing} />}


            {/* Desktop */}
            <TableFrame
                wrapperRef={tableWrapperRef}
                headScrollRef={headScrollRef}
                bodyScrollRef={bodyScrollRef}
                scrollbarRef={scrollbarRef}
                scrollbarInnerRef={scrollbarInnerRef}
                onScroll={syncFrom}
                visibleColumns={visibleLeafColumns}
                totalWidth={table.getTotalSize()}
                cellBorders={cellBorders}
                isResizing={isResizing}
                isBusy={isLoading || isRefreshing}
                showProgress={isRefreshing && hasData}
                stickyHeader={stickyHeader}
                headerTop={headerTop}
                maxBodyHeight={maxBodyHeight}
                header={
                    <MemoBlock
                        deps={[
                            finalColumns,
                            sorting,
                            columnFilters,
                            columnVisibility,
                            columnOrder,
                            columnSizing,
                            table.state.columnResizing,
                            stickyOffsets,
                            headerIcons,
                            headerSelection,
                        ]}
                    >
                        <TableHeaderRows table={table} getSticky={getSticky} showIcons={headerIcons} />
                    </MemoBlock>
                }
                body={
                    <TableBody>
                        <TableBodyRows
                            frozen={isResizing}
                            rows={pageRows}
                            visibleColumns={visibleLeafColumns}
                            getSticky={getSticky}
                            showSkeleton={showSkeleton}
                            skeletonCount={skeletonCount}
                            activeRowId={details.detailsRowId}
                            rovingRowId={keyboard.rovingRowId}
                            clickable={!!renderDetails}
                            onRowFocus={setFocusedRowId}
                            onRowKeyDown={keyboard.handleRowKeyDown}
                            onRowClick={details.handleRowClick}
                            state={tableState}
                        />
                    </TableBody>
                }
            />

            {/* Mobile: only rendered on narrow screens (it used to render hidden on desktop too) */}
            {!isDesktop && (
                <MobileCardList
                    rows={pageRows}
                    cardFields={cardFields}
                    actions={actions}
                    selectable={selectable}
                    clickable={!!renderDetails}
                    activeRowId={details.detailsRowId}
                    onRowClick={details.handleRowClick}
                    showSkeleton={showSkeleton}
                    state={tableState}
                />
            )}

            <MemoBlock
                deps={[
                    pagination.pageNumber,
                    pagination.pageCount,
                    pagination.pageSize,
                    pagination.totalCount,
                    pagination.rangeStart,
                    pagination.rangeEnd,
                    pagination.canJumpToPage,
                    pagination.canChangePageSize,
                    pagination.sizeChoices.join(),
                    showSkeleton,
                    showErrorState,
                    enableKeyboardShortcuts,
                ]}
            >
                <DataTablePagination
                    pagination={stablePagination}
                    status={showSkeleton ? "Loading…" : showErrorState ? "" : undefined}
                    showPageLinks={!showSkeleton && !showErrorState}
                    onShowShortcuts={enableKeyboardShortcuts ? stable.showShortcuts : undefined}
                />
            </MemoBlock>

            {renderDetails && (
                <DetailsDrawer
                    row={details.detailsRow?.original}
                    index={details.detailsIndex}
                    total={matchingRows.length}
                    onStep={details.stepDetails}
                    onClose={() => details.setDetailsRowId(null)}
                    onCloseAutoFocus={details.handleCloseAutoFocus}
                    title={getDetailsTitle}
                    description={getDetailsDescription}
                >
                    {renderDetails}
                </DetailsDrawer>
            )}

            {enableKeyboardShortcuts && (
                <MemoBlock deps={[shortcutsOpen]}>
                    <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
                </MemoBlock>
            )}
        </div>
    )
}
