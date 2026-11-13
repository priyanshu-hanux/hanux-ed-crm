import * as React from "react"
import type { RowData, Table } from "@tanstack/react-table"
import { ChevronDown, ChevronRight, ListFilter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getFilterableColumns, labelOf } from "../../helpers/columns"
import { ColumnIcon } from "../cells/column-header-label"
import { summarize } from "../../helpers/filter-summary"
import type { DataTableFeatures } from "../../types/column"
import type { FilterView } from "../../types/filters"
import { FilterPanel } from "./filter-panels"

/* ---------------------------------------------------------------------- */
/* Filters popover: list of filterable columns → one column's panel     */
/* ---------------------------------------------------------------------- */

export function DataTableFilters<TData extends RowData>({
    table,
    view: controlledView,
    onViewChange,
}: {
    table: Table<DataTableFeatures, TData>
    /** Control the popover from outside, e.g. to open a column's panel from a chip */
    view?: FilterView
    onViewChange?: (view: FilterView) => void
}) {
    const [internalView, setInternalView] = React.useState<FilterView>({ open: false, columnId: null })
    const view = controlledView ?? internalView
    const setView = onViewChange ?? setInternalView

    const listRef = React.useRef<HTMLUListElement>(null)
    const returnFocusTo = React.useRef<string | null>(null)

    const columns = getFilterableColumns(table)
    const activeColumn = view.columnId ? columns.find((column) => column.id === view.columnId) : undefined
    const activeCount = columns.filter((column) => summarize(column) !== null).length

    // After going back, put focus on the row we came from
    React.useEffect(() => {
        if (view.columnId || !returnFocusTo.current) return
        listRef.current
            ?.querySelector<HTMLElement>(`[data-filter-row="${CSS.escape(returnFocusTo.current)}"]`)
            ?.focus()
        returnFocusTo.current = null
    }, [view.columnId])

    if (columns.length === 0) return null

    const openColumn = (columnId: string) => setView({ open: true, columnId })

    const back = () => {
        returnFocusTo.current = view.columnId
        setView({ open: true, columnId: null })
    }

    const clearAll = () => {
        const ids = new Set(columns.map((column) => column.id))
        table.setColumnFilters((prev) => prev.filter((filter) => !ids.has(filter.id)))
    }

    return (
        <Popover
            open={view.open}
            onOpenChange={(next) => setView({ open: next, columnId: next ? view.columnId : null })}
        >
            <PopoverTrigger asChild>
                <Button variant="ghost" className="shrink-0 gap-2 max-sm:px-2.5">
                    <ListFilter className="size-4" />
                    <span className="hidden sm:inline">Filter</span>
                    {/* One slot for both, so the button keeps its width: a chevron, or the count once filters apply */}
                    <span className="grid min-w-5 place-items-center *:col-start-1 *:row-start-1">
                        <ChevronDown
                            aria-hidden="true"
                            className={cn(
                                "size-3.5 transition-[opacity,scale] duration-200 ease-(--ease-smooth)",
                                activeCount > 0 ? "scale-50 opacity-0" : "opacity-60"
                            )}
                        />
                        <span
                            aria-hidden="true"
                            className={cn(
                                "flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold tabular-nums text-background transition-[opacity,scale] duration-200 ease-(--ease-smooth)",
                                activeCount > 0 ? "scale-100 opacity-100" : "scale-50 opacity-0"
                            )}
                        >
                            {activeCount}
                        </span>
                    </span>
                    {activeCount > 0 && <span className="sr-only">, {activeCount} active</span>}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="w-80 overflow-hidden rounded-xl p-0"
                // In a panel, Escape goes back to the list instead of closing
                onEscapeKeyDown={(event) => {
                    if (view.columnId) {
                        event.preventDefault()
                        back()
                    }
                }}
            >
                {activeColumn ? (
                    <FilterPanel key={activeColumn.id} column={activeColumn} onBack={back} />
                ) : (
                    <div>
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <p className="text-sm font-semibold">Filter</p>
                            <button
                                type="button"
                                onClick={clearAll}
                                disabled={activeCount === 0}
                                className="rounded text-xs font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-40"
                            >
                                Clear all
                            </button>
                        </div>

                        <ul ref={listRef} className="scroll-thin max-h-80 overflow-y-auto p-1.5">
                            {columns.map((column) => {
                                const label = labelOf(column)
                                const summary = summarize(column)
                                return (
                                    <li
                                        key={column.id}
                                        onClick={() => openColumn(column.id)}
                                        className="group flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 hover:bg-muted/60"
                                    >
                                        <ColumnIcon column={column} className="group-hover:text-foreground" />
                                        <button
                                            type="button"
                                            data-filter-row={column.id}
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                openColumn(column.id)
                                            }}
                                            aria-label={summary ? `${label}: ${summary}. Edit filter` : `Filter by ${label}`}
                                            className="min-w-0 flex-1 truncate rounded-sm text-left text-sm text-muted-foreground group-hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            {label}
                                        </button>

                                        {summary && (
                                            <span className="flex max-w-[60%] items-center gap-1 rounded-full border border-primary/20 bg-primary/10 py-0.5 pl-2 pr-0.5 text-xs font-medium text-primary">
                                                <span className="truncate">{summary}</span>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        column.setFilterValue(undefined)
                                                    }}
                                                    aria-label={`Remove ${label} filter`}
                                                    className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/80"
                                                >
                                                    <X className="size-2.5" strokeWidth={3} />
                                                </button>
                                            </span>
                                        )}

                                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
