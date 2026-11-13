import {
    columnFacetingFeature,
    columnFilteringFeature,
    columnOrderingFeature,
    columnResizingFeature,
    columnSizingFeature,
    columnVisibilityFeature,
    createFacetedMinMaxValues,
    createFacetedRowModel,
    createFacetedUniqueValues,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_includesString,
    globalFilteringFeature,
    metaHelper,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    sortFn_datetime,
    sortFn_text,
    tableFeatures,
} from "@tanstack/react-table"

import { numberRange, selectAnyOf, textContains } from "../helpers/filter-fns"
import type { ColumnFilterType, DataTableColumnMeta } from "../types/column"

/** Every feature, row model and filter/sort function the table registers with TanStack */
export const dataTableFeatures = tableFeatures({
    columnOrderingFeature,
    rowSelectionFeature,
    columnVisibilityFeature,
    columnSizingFeature,
    columnFilteringFeature,
    globalFilteringFeature,
    columnFacetingFeature,
    columnResizingFeature,

    filteredRowModel: createFilteredRowModel(),
    facetedRowModel: createFacetedRowModel(),
    facetedUniqueValues: createFacetedUniqueValues(),
    facetedMinMaxValues: createFacetedMinMaxValues(),
    filterFns: {
        includesString: filterFn_includesString,
        textContains,
        selectAnyOf,
        numberRange,
    },
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {
        alphanumeric: sortFn_alphanumeric,
        basic: sortFn_basic,
        datetime: sortFn_datetime,
        text: sortFn_text,
    },
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
    columnMeta: metaHelper<DataTableColumnMeta>(),
})

/** The registered filter function each `meta.filter.type` uses, unless the column sets its own filterFn */
export const FILTER_FN_BY_TYPE = {
    text: "textContains",
    select: "selectAnyOf",
    range: "numberRange",
} as const satisfies Record<ColumnFilterType, string>
