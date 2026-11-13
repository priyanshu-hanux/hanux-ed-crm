import type { AnyDataTableColumn, SelectFilterConfig } from "../types/column"
import type { FilterOptionWithCount, RangeFilterValue, SelectFilterValue } from "../types/filters"
import { optionKey, toNumber } from "./filter-fns"

/** The filter config of a column that is known to have one */
export function filterConfigOf(column: AnyDataTableColumn) {
    return column.columnDef.meta!.filter!
}

/** The spelling most rows use; on a tie, one with capitals wins ("Infosys" over "infosys") */
function preferredSpelling(spellings: Map<string, number>): string {
    let best = ""
    let bestScore = -1
    spellings.forEach((count, spelling) => {
        const score = count * 2 + (spelling !== spelling.toLowerCase() ? 1 : 0)
        if (score > bestScore) {
            best = spelling
            bestScore = score
        }
    })
    return best
}

/**
 * Choices for a select filter: fixed options, or the values found in the data, with counts.
 * Values that differ only by capitals or spacing ("Infosys" / "infosys") are one option.
 */
export function getSelectOptions(column: AnyDataTableColumn, config: SelectFilterConfig): FilterOptionWithCount[] {
    // Counts respect the other active filters, so they show what you'd actually get
    const facets = facetedValues(column)
    const groups = new Map<string, { count: number; spellings: Map<string, number> }>()
    facets.forEach((count, raw) => {
        for (const value of Array.isArray(raw) ? raw : [raw]) {
            const label = value == null ? "" : String(value).trim()
            if (!label) continue
            const key = optionKey(label)
            const group = groups.get(key) ?? { count: 0, spellings: new Map<string, number>() }
            group.count += count
            group.spellings.set(label, (group.spellings.get(label) ?? 0) + count)
            groups.set(key, group)
        }
    })

    if (config.options) {
        return config.options.map((option) => ({ ...option, count: groups.get(optionKey(option.value))?.count ?? 0 }))
    }
    return [...groups.values()]
        .map(({ count, spellings }) => ({ value: preferredSpelling(spellings), count }))
        .sort((a, b) => a.value.localeCompare(b.value))
}

/**
 * The values the filter offers, with how many rows have each, respecting the other active filters.
 * Uses meta.filterValue when the column filters on something other than its value.
 */
function facetedValues(column: AnyDataTableColumn): Map<unknown, number> {
    const filterValue = column.columnDef.meta?.filterValue
    if (!filterValue) return column.getFacetedUniqueValues() as Map<unknown, number>
    const counts = new Map<unknown, number>()
    for (const row of column.getFacetedRowModel().rows) {
        const raw = filterValue(row.original)
        // A list counts each distinct item once for this row
        const items = Array.isArray(raw) ? [...new Set(raw)] : [raw]
        for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
    }
    return counts
}

/** Smallest and largest number among a column's values (values like "5 years" count as 5) */
export function getNumericBounds(column: AnyDataTableColumn): { low: number; high: number } | null {
    let low = Infinity
    let high = -Infinity
    facetedValues(column).forEach((_, raw) => {
        for (const item of Array.isArray(raw) ? raw : [raw]) {
            const value = toNumber(item)
            if (value === undefined) continue
            low = Math.min(low, value)
            high = Math.max(high, value)
        }
    })
    return Number.isFinite(low) ? { low, high } : null
}

/** Text for the chip, or null when the column has no active filter */
export function summarize(column: AnyDataTableColumn): string | null {
    const config = filterConfigOf(column)
    const value = column.getFilterValue()
    if (value == null) return null

    switch (config.type) {
        case "text":
            return String(value).trim() || null
        case "select": {
            const values = value as SelectFilterValue
            if (!values.length) return null
            const label = (v: string) => config.options?.find((o) => o.value === v)?.label ?? v
            return values.length === 1 ? label(values[0]) : `${label(values[0])} +${values.length - 1}`
        }
        case "range": {
            const [min, max] = value as RangeFilterValue
            const unit = config.unit ? ` ${config.unit}` : ""
            if (min != null && max != null) return min === max ? `${min}${unit}` : `${min}–${max}${unit}`
            if (min != null) return `≥ ${min}${unit}`
            if (max != null) return `≤ ${max}${unit}`
            return null
        }
    }
}
