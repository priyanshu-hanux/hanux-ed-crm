import type { RowData, Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { getFilterableColumns, labelOf } from "../../helpers/columns"
import { summarize } from "../../helpers/filter-summary"
import type { DataTableFeatures } from "../../types/column"

interface ActiveFilterChipsProps<TData extends RowData> {
    table: Table<DataTableFeatures, TData>
    /** The applied search term (not the text still being typed) */
    search: string
    onClearSearch: () => void
    onEditSearch?: () => void
    /** Open the Filters popover on this column's panel */
    onEditFilter: (columnId: string) => void
}

export function ActiveFilterChips<TData extends RowData>({
    table,
    search,
    onClearSearch,
    onEditSearch,
    onEditFilter,
}: ActiveFilterChipsProps<TData>) {
    const activeFilters = getFilterableColumns(table)
        .map((column) => ({ column, summary: summarize(column) }))
        .filter((item): item is typeof item & { summary: string } => item.summary !== null)

    const searchTerm = search.trim()
    const chipCount = activeFilters.length + (searchTerm ? 1 : 0)
    if (chipCount === 0) return null

    return (
        <div role="region" aria-label="Active filters" className="-mt-2 flex flex-wrap items-center gap-2">
            {searchTerm && (
                <FilterChip
                    label="Search"
                    value={`“${searchTerm}”`}
                    onEdit={onEditSearch}
                    editLabel="Edit search"
                    onRemove={onClearSearch}
                    removeLabel="Clear search"
                />
            )}

            {activeFilters.map(({ column, summary }) => {
                const label = labelOf(column)
                return (
                    <FilterChip
                        key={column.id}
                        label={label}
                        value={summary}
                        onEdit={() => onEditFilter(column.id)}
                        editLabel={`Edit ${label} filter`}
                        onRemove={() => column.setFilterValue(undefined)}
                        removeLabel={`Remove ${label} filter`}
                    />
                )
            })}

            {chipCount > 1 && (
                <button
                    type="button"
                    onClick={() => {
                        table.setColumnFilters([])
                        onClearSearch()
                    }}
                    className="rounded px-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Clear all
                </button>
            )}
        </div>
    )
}

function FilterChip({
    label,
    value,
    onEdit,
    editLabel,
    onRemove,
    removeLabel,
}: {
    label: string
    value: string
    onEdit?: () => void
    editLabel: string
    onRemove: () => void
    removeLabel: string
}) {
    const content = (
        <>
            <span className="shrink-0 text-muted-foreground">{label}:</span>
            <span className="truncate font-medium text-foreground">{value}</span>
        </>
    )

    return (
        <span className="inline-flex h-7 max-w-full items-center rounded-full border bg-background text-xs shadow-xs">
            {onEdit ? (
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label={`${editLabel}: ${value}`}
                    title="Edit"
                    className="flex min-w-0 max-w-64 items-center gap-1 rounded-l-full py-1 pl-3 pr-1.5 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {content}
                </button>
            ) : (
                <span className="flex min-w-0 max-w-64 items-center gap-1 py-1 pl-3 pr-1.5">{content}</span>
            )}
            <button
                type="button"
                onClick={onRemove}
                aria-label={removeLabel}
                className="mr-1 flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <X className="size-3" />
            </button>
        </span>
    )
}