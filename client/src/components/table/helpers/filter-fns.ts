import type { RangeFilterValue, SelectFilterValue, TextFilterValue } from "../types/filters"

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

/** Lowercase, trimmed, accents removed: "José" matches "jose" */
export function normalizeText(value: unknown): string {
    if (value == null) return ""
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
}

/** Key that makes select values equal when they differ only by capitals, accents or spacing:
 *  "Infosys", " infosys " and "INFOSYS" are one option */
export function optionKey(value: unknown): string {
    return normalizeText(value).replace(/\s+/g, " ")
}

/** 5 → 5, "5 years" → 5, "1,200" → 1200, "N/A" → undefined */
export function toNumber(value: unknown): number | undefined {
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value.replace(/,/g, ""))
        return Number.isFinite(parsed) ? parsed : undefined
    }
    return undefined
}

type RowLike = { original: unknown; getValue: (columnId: string) => unknown }

/* ---------------------------------------------------------------------- */
/* Column filter functions                                                 */
/* autoRemove: TanStack drops the filter when this returns true            */
/* ---------------------------------------------------------------------- */

export const textContains = Object.assign(
    (row: RowLike, columnId: string, filterValue: TextFilterValue) =>
        normalizeText(row.getValue(columnId)).includes(normalizeText(filterValue)),
    { autoRemove: (value: unknown) => !normalizeText(value) }
)

/** Row matches if its value (or any of its values, for arrays) is one of the selected values, ignoring capitals */
export const selectAnyOf = Object.assign(
    (row: RowLike, columnId: string, filterValue: SelectFilterValue) => {
        const raw = row.getValue(columnId)
        const values = Array.isArray(raw) ? raw : raw == null ? [] : [raw]
        const selected = new Set(filterValue.map(optionKey))
        return values.some((value) => selected.has(optionKey(value)))
    },
    { autoRemove: (value: unknown) => !Array.isArray(value) || value.length === 0 }
)

export const numberRange = Object.assign(
    (row: RowLike, columnId: string, [min, max]: RangeFilterValue) => {
        const value = toNumber(row.getValue(columnId))
        if (value === undefined) return false
        return (min === undefined || value >= min) && (max === undefined || value <= max)
    },
    {
        autoRemove: (value: unknown) =>
            !Array.isArray(value) || (value[0] === undefined && value[1] === undefined),
    }
)

/* ---------------------------------------------------------------------- */
/* Global search                                                           */
/* ---------------------------------------------------------------------- */

/**
 * Searches several columns at once, and every word must match somewhere in the row:
 * "rakesh infosys" finds Rakesh at Infosys, even though the words are in different columns.
 * Each row's searchable text is built once and cached, so typing stays fast on large tables.
 */
export function createGlobalSearchFn(searchColumnIds: string[]) {
    const cache = new WeakMap<object, string>()

    const haystackOf = (row: RowLike) => {
        const key = row.original as object
        let text = cache.get(key)
        if (text === undefined) {
            text = searchColumnIds.map((id) => normalizeText(row.getValue(id))).join(" ")
            cache.set(key, text)
        }
        return text
    }

    return (row: RowLike, _columnId: string, filterValue: string) => {
        const terms = normalizeText(filterValue).split(/\s+/).filter(Boolean)
        if (terms.length === 0) return true
        const haystack = haystackOf(row)
        return terms.every((term) => haystack.includes(term))
    }
}

/** The filter function behind each filter type */
export const FILTER_FNS = { text: textContains, select: selectAnyOf, range: numberRange }
