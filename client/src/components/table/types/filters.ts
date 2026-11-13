import type { ColumnFiltersState } from "@tanstack/react-table"

import type { FilterOption } from "./column"

/** text filter: the search string */
export type TextFilterValue = string
/** select filter: always an array, single-select just holds one value */
export type SelectFilterValue = string[]
/** range filter: [min, max], either side optional */
export type RangeFilterValue = [number | undefined, number | undefined]

/** A select option plus how many rows have it */
export type FilterOptionWithCount = FilterOption & { count?: number }

/** Which part of the Filters popover is showing */
export interface FilterView {
    open: boolean
    /** null = the list of columns; an id = that column's panel */
    columnId: string | null
}

/** What the table reports through onFiltersChange in server mode */
export interface DataTableFiltersState {
    columnFilters: ColumnFiltersState
    globalFilter: string
}
