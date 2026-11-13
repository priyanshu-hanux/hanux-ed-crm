import type { ComponentType } from "react"
import type { Column, ColumnDef as TanstackColumnDef, RowData } from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"

import type { dataTableFeatures } from "../config/features"

/* ---------------------------------------------------------------------- */
/* Features                                                                */
/* ---------------------------------------------------------------------- */

/** Every TanStack feature, row model and filter/sort function the table registers */
export type DataTableFeatures = typeof dataTableFeatures

/** A column definition for <DataTable /> */
export type ColumnDef<TData extends RowData, TValue = unknown> = TanstackColumnDef<DataTableFeatures, TData, TValue>

/** A column of any row type (for code that only reads meta, labels or filter values) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDataTableColumn = Column<DataTableFeatures, any, unknown>

/* ---------------------------------------------------------------------- */
/* Column meta                                                             */
/* ---------------------------------------------------------------------- */

export type StickySide = "left" | "right"

/** Placeholder shape while loading */
export type SkeletonVariant = "text" | "avatar" | "badge" | "none"

export interface CopyableConfig {
    /** Text to put on the clipboard. Defaults to the cell's value. Return null/"" to hide the button for that row. */
    getText?: (row: unknown) => string | null | undefined
    /** Used in the button's label and messages, e.g. "phone number". Defaults to the column's displayName. */
    label?: string
}

export interface FilterOption {
    value: string
    label?: string
    icon?: LucideIcon
}

export type ColumnFilterConfig =
    | { type: "text"; placeholder?: string }
    | {
        type: "select"
        /** true = "is any of" (several values), false = "is" (one value). Default: false */
        multiple?: boolean
        /** Fixed choices. Leave out to build them from the data, with counts. */
        options?: FilterOption[]
    }
    | { type: "range"; min?: number; max?: number; step?: number; unit?: string }

export type ColumnFilterType = ColumnFilterConfig["type"]
export type SelectFilterConfig = Extract<ColumnFilterConfig, { type: "select" }>
export type RangeFilterConfig = Extract<ColumnFilterConfig, { type: "range" }>

/** An icon for a column: any Lucide icon, or your own component that takes a className */
export type ColumnIconComponent = ComponentType<{ className?: string }>

/** What `meta` accepts on a column definition */
export interface DataTableColumnMeta {
    displayName?: string
    /** Shown before the column's name in its header, the Columns dialog and the Filters menu */
    icon?: ColumnIconComponent
    sticky?: StickySide
    copyable?: boolean | CopyableConfig
    filter?: ColumnFilterConfig
    /** What the filter looks at instead of the column's value (options, counts and matching). Default: the value */
    filterValue?: (row: unknown) => unknown
    /** Placeholder shape while loading. Default: "text" */
    skeleton?: SkeletonVariant
    /** Value written to CSV. Default: the column's value. Use when the cell value isn't readable text. */
    exportValue?: (row: unknown) => unknown
    /** false = leave this column out of exports. Default: true */
    exportable?: boolean
}
