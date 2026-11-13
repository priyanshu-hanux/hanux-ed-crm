import type * as React from "react"
import type { RowData, SortFn } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
    ColumnDef,
    ColumnFilterConfig,
    ColumnIconComponent,
    DataTableColumnMeta,
    DataTableFeatures,
    SkeletonVariant,
    StickySide,
} from "../../types/column"
import { EmptyCell } from "../cells/empty-cell"
import { MultiValueCell } from "../cells/multi-value-cell"
import { createSortableHeader } from "../cells/sortable-header"
import { TagsCell } from "../cells/tags-cell"

/* ---------------------------------------------------------------------- */
/* Column builders                                                         */
/*                                                                         */
/* Turn a few lines of config into a full column definition, so a table    */
/* for any data type only says *where* each value comes from. The header,  */
/* sorting, empty state, filter, copy button and CSV export are handled    */
/* the same way for every column. Write a plain ColumnDef (or use          */
/* `overrides`) whenever a column needs something these don't cover.       */
/* ---------------------------------------------------------------------- */

/** Options every builder accepts */
export interface BaseColumnOptions<TData extends RowData> {
    /** Stable id: used for saved layouts, URL filters and searchColumns */
    id: string
    /** Header text; also the name in the Columns dialog, Filters menu and CSV header */
    title: string
    icon?: ColumnIconComponent
    /** Show a sort button in the header. Defaults per builder (text and numbers: yes, lists: no) */
    sortable?: boolean
    filter?: ColumnFilterConfig
    /**
     * What the filter looks at, when it isn't the column's value. The cell can show
     * "B.Tech in Computer Science (IIT Bombay)" while the filter offers degrees: (c) => c.education.map((e) => e.degree).
     * Return a list to match on any of its items. Default: the column's value
     */
    filterValue?: (row: TData) => unknown
    sticky?: StickySide
    skeleton?: SkeletonVariant
    size?: number
    minSize?: number
    maxSize?: number
    /** false = the column can't be hidden from the Columns dialog */
    hideable?: boolean
    /** Adds a copy button to the cell */
    copy?: {
        /** Text to copy; return null/"" to hide the button for that row */
        text: (row: TData) => string | null | undefined
        /** Used in the button's label, e.g. "phone number". Default: the title */
        label?: string
    }
    /** What goes in the CSV. Default: the column's value. false = leave the column out of exports. */
    exportValue?: ((row: TData) => unknown) | false
    /** Text shown (in the standard empty-cell style) when there's no value. Default: "---" */
    empty?: React.ReactNode
    /** Escape hatch: any other column definition fields, applied last */
    overrides?: Partial<ColumnDef<TData, unknown>>
}

/** Turns builder options into the parts every column shares */
function baseColumn<TData extends RowData>(
    options: BaseColumnOptions<TData>,
    sortableByDefault: boolean,
    extraMeta?: Partial<DataTableColumnMeta>
): ColumnDef<TData, unknown> {
    const sortable = options.sortable ?? sortableByDefault
    const { copy, exportValue, filterValue } = options
    const meta: DataTableColumnMeta = {
        displayName: options.title,
        icon: options.icon,
        sticky: options.sticky,
        skeleton: options.skeleton,
        filter: options.filter,
        ...(filterValue && { filterValue: (row: unknown) => filterValue(row as TData) }),
        ...(copy && {
            copyable: { getText: (row: unknown) => copy.text(row as TData) ?? null, label: copy.label },
        }),
        ...(exportValue === false
            ? { exportable: false }
            : exportValue && { exportValue: (row: unknown) => exportValue(row as TData) }),
        ...extraMeta,
    }
    return {
        id: options.id,
        header: sortable ? createSortableHeader<TData>(options.title) : options.title,
        enableSorting: sortable,
        // Rows without a value go last, whichever direction
        sortUndefined: "last",
        enableHiding: options.hideable ?? true,
        meta,
        ...(options.size !== undefined && { size: options.size }),
        ...(options.minSize !== undefined && { minSize: options.minSize }),
        ...(options.maxSize !== undefined && { maxSize: options.maxSize }),
    }
}

/** Applies `overrides` last, merging meta instead of replacing it */
function withOverrides<TData extends RowData>(
    column: ColumnDef<TData, unknown>,
    overrides: Partial<ColumnDef<TData, unknown>> | undefined
): ColumnDef<TData, unknown> {
    if (!overrides) return column
    return { ...column, ...overrides, meta: { ...column.meta, ...overrides.meta } } as ColumnDef<TData, unknown>
}

/** "  Infosys " → "Infosys", "" / "   " / null → undefined */
function cleanText(value: string | null | undefined): string | undefined {
    const text = typeof value === "string" ? value.trim() : undefined
    return text || undefined
}

/** Trimmed, without blanks */
function cleanStrings(values: readonly (string | null | undefined)[] | null | undefined): string[] {
    return (values ?? []).map(cleanText).filter((value): value is string => value !== undefined)
}

/** The cleaned list as a column value; an empty list counts as no value (so it sorts last) */
function listValue(values: readonly (string | null | undefined)[] | null | undefined): string[] | undefined {
    const list = cleanStrings(values)
    return list.length ? list : undefined
}

/* ---------------------------------------------------------------------- */
/* Text                                                                    */
/* ---------------------------------------------------------------------- */

export interface TextColumnOptions<TData extends RowData> extends BaseColumnOptions<TData> {
    /** The text, e.g. (row) => row.company. Blank text counts as no value. */
    value: (row: TData) => string | null | undefined
    /** Custom display; receives the cleaned text. Default: one truncated line with a tooltip */
    render?: (value: string, row: TData) => React.ReactNode
    /** Classes for the default display, e.g. "font-medium" */
    className?: string
}

/** One line of text. Sortable by default; works with "text" and "select" filters. */
export function textColumn<TData extends RowData>(options: TextColumnOptions<TData>): ColumnDef<TData, unknown> {
    const { value, render, className } = options
    return withOverrides(
        {
            ...baseColumn(options, true),
            accessorFn: (row: TData) => cleanText(value(row)),
            cell: ({ row }) => {
                const text = cleanText(value(row.original))
                if (text === undefined) return <EmptyCell>{options.empty}</EmptyCell>
                return render ? (
                    render(text, row.original)
                ) : (
                    <span className={cn("block truncate text-[13px]", className)} title={text}>
                        {text}
                    </span>
                )
            },
        },
        options.overrides
    )
}

/* ---------------------------------------------------------------------- */
/* Number                                                                  */
/* ---------------------------------------------------------------------- */

export interface NumberColumnOptions<TData extends RowData> extends BaseColumnOptions<TData> {
    /** The number used for sorting and range filters, e.g. (row) => row.price */
    value: (row: TData) => number | null | undefined
    /** How it's shown (and exported), e.g. (value) => `${value} yrs`. Default: the number */
    format?: (value: number, row: TData) => string | undefined
    /** "badge" shows the text in a small badge. Default: "text" */
    display?: "text" | "badge"
}

/** A number shown as text or a badge. Sortable by default; works with "range" filters. */
export function numberColumn<TData extends RowData>(options: NumberColumnOptions<TData>): ColumnDef<TData, unknown> {
    const { value, format, display = "text" } = options
    const read = (row: TData) => {
        const number = value(row)
        return typeof number === "number" && Number.isFinite(number) ? number : undefined
    }
    const text = (row: TData) => {
        const number = read(row)
        return number === undefined ? undefined : (format?.(number, row) ?? String(number))
    }
    return withOverrides(
        {
            ...baseColumn(
                // CSV gets the formatted text ("5 yrs"), unless the caller says otherwise
                { ...options, exportValue: options.exportValue ?? ((row: TData) => text(row) ?? "") },
                true
            ),
            accessorFn: read,
            cell: ({ row }) => {
                const shown = text(row.original)
                if (shown === undefined) return <EmptyCell>{options.empty}</EmptyCell>
                return display === "badge" ? (
                    <Badge variant="secondary" className="whitespace-nowrap font-medium text-[13px]">
                        {shown}
                    </Badge>
                ) : (
                    <span className="block truncate text-[13px] tabular-nums">{shown}</span>
                )
            },
        },
        options.overrides
    )
}

/* ---------------------------------------------------------------------- */
/* List (emails, phones, …)                                                */
/* ---------------------------------------------------------------------- */

export interface ListColumnOptions<TData extends RowData> extends BaseColumnOptions<TData> {
    /** The values, primary first, e.g. (row) => row.emails */
    values: (row: TData) => readonly (string | null | undefined)[] | null | undefined
    /** Singular name for labels: "email" → "Show all 3 emails" */
    label: string
    /** Link for a value, e.g. mailto: */
    href?: (value: string) => string | undefined
    /** Text the card's copy buttons copy for a value. Default: the value */
    copyValue?: (value: string) => string
    /** Small tag next to a value in the card, e.g. "Work" */
    tag?: (value: string, row: TData) => string | undefined
    className?: string
}

/**
 * The first value and a "+N" card with all of them. Not sortable by default; when sortable,
 * it sorts by the first value. Search, "select" filters and CSV export see every value.
 */
export function listColumn<TData extends RowData>(options: ListColumnOptions<TData>): ColumnDef<TData, unknown> {
    const { values, label, href, copyValue, tag, className } = options
    const firstOf = (row: TData) => cleanStrings(values(row))[0] ?? ""
    const byFirstValue: SortFn<DataTableFeatures, TData> = (a, b) => firstOf(a.original).localeCompare(firstOf(b.original))
    return withOverrides(
        {
            ...baseColumn(options, false),
            accessorFn: (row: TData) => listValue(values(row)),
            // Note: TanStack v9 calls this option sortFn (v8 called it sortingFn)
            sortFn: byFirstValue,
            cell: ({ row }) => (
                <MultiValueCell
                    values={cleanStrings(values(row.original))}
                    label={label}
                    getHref={href}
                    getCopyText={copyValue}
                    getTag={tag && ((value) => tag(value, row.original))}
                    emptyText={options.empty}
                    className={className}
                />
            ),
        },
        options.overrides
    )
}

/* ---------------------------------------------------------------------- */
/* Tags (skills, keywords, …)                                              */
/* ---------------------------------------------------------------------- */

export interface TagsColumnOptions<TData extends RowData> extends BaseColumnOptions<TData> {
    /** The tags, e.g. (row) => row.skills. Pass them cleaned: duplicates break React keys. */
    values: (row: TData) => readonly string[] | null | undefined
    /** Plural name for labels: "skills" → "Show all 15 skills" */
    label: string
    /** How many fit in the cell before "+N". Default 3 */
    max?: number
}

/** Badges, with a "+N" card holding all of them. Not sortable by default. */
export function tagsColumn<TData extends RowData>(options: TagsColumnOptions<TData>): ColumnDef<TData, unknown> {
    const { values, label, max } = options
    return withOverrides(
        {
            ...baseColumn(options, false),
            accessorFn: (row: TData) => listValue(values(row)),
            cell: ({ row }) => (
                <TagsCell
                    tags={cleanStrings(values(row.original))}
                    label={label}
                    max={max}
                    emptyText={options.empty}
                />
            ),
        },
        options.overrides
    )
}

/* ---------------------------------------------------------------------- */
/* Custom                                                                  */
/* ---------------------------------------------------------------------- */

export interface CustomColumnOptions<TData extends RowData> extends BaseColumnOptions<TData> {
    /** The value for sorting, filtering, search and CSV. Leave out for display-only columns. */
    value?: (row: TData) => unknown
    /** The cell's content */
    render: (row: TData) => React.ReactNode
    /** How to compare two rows when sorting. Default: by `value` */
    sortFn?: SortFn<DataTableFeatures, TData>
}

/** Any cell you render yourself, with the same header, meta, copy and export handling as the others */
export function customColumn<TData extends RowData>(options: CustomColumnOptions<TData>): ColumnDef<TData, unknown> {
    const { value, render, sortFn } = options
    return withOverrides(
        {
            ...baseColumn(options, false),
            ...(value && { accessorFn: (row: TData) => value(row) }),
            ...(sortFn && { sortFn }),
            cell: ({ row }) => render(row.original),
        },
        options.overrides
    )
}
