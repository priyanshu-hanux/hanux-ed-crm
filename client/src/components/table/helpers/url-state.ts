import type { ColumnFiltersState } from "@tanstack/react-table"

import { SEARCH_URL_PARAM } from "../config/constants"
import type { ColumnFilterConfig } from "../types/column"
import type { RangeFilterValue } from "../types/filters"
import { toNumber } from "./filter-fns"

/* ---------------------------------------------------------------------- */
/* Search and filters in the URL                                           */
/*   ?q=tcs                     search                                     */
/*   &name=priya                text                                       */
/*   &company=Infosys&company=TCS   select (repeated key per value)        */
/*   &experience=5..8           range ("5.." = at least 5, "..8" = at most 8) */
/* ---------------------------------------------------------------------- */

const paramName = (prefix: string, id: string) => (prefix ? `${prefix}.${id}` : id)

export function readFiltersFromUrl(configs: Map<string, ColumnFilterConfig>, prefix = "") {
    const empty = { columnFilters: [] as ColumnFiltersState, search: "" }
    if (typeof window === "undefined") return empty

    const params = new URLSearchParams(window.location.search)
    const columnFilters: ColumnFiltersState = []

    configs.forEach((config, id) => {
        const key = paramName(prefix, id)
        switch (config.type) {
            case "text": {
                const value = params.get(key)?.trim()
                if (value) columnFilters.push({ id, value })
                break
            }
            case "select": {
                const values = params.getAll(key).map((v) => v.trim()).filter(Boolean)
                // A single-value filter keeps only the first, even if the URL has more
                if (values.length) columnFilters.push({ id, value: config.multiple ? values : values.slice(0, 1) })
                break
            }
            case "range": {
                const raw = params.get(key)
                if (!raw) break
                const [low, high] = raw.split("..")
                const min = toNumber(low)
                const max = toNumber(high)
                if (min !== undefined || max !== undefined) columnFilters.push({ id, value: [min, max] })
                break
            }
        }
    })

    return { columnFilters, search: params.get(paramName(prefix, SEARCH_URL_PARAM))?.trim() ?? "" }
}

export function writeFiltersToUrl(
    columnFilters: ColumnFiltersState,
    search: string,
    configs: Map<string, ColumnFilterConfig>,
    prefix = ""
) {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    const params = url.searchParams

    // Remove only this table's params; anything else in the URL stays untouched
    configs.forEach((_, id) => params.delete(paramName(prefix, id)))
    params.delete(paramName(prefix, SEARCH_URL_PARAM))

    if (search.trim()) params.set(paramName(prefix, SEARCH_URL_PARAM), search.trim())

    for (const { id, value } of columnFilters) {
        const config = configs.get(id)
        if (!config) continue
        const key = paramName(prefix, id)
        if (config.type === "text") {
            params.set(key, String(value))
        } else if (config.type === "select") {
            for (const v of value as string[]) params.append(key, v)
        } else {
            const [min, max] = value as RangeFilterValue
            params.set(key, `${min ?? ""}..${max ?? ""}`)
        }
    }

    const query = params.toString()
    const next = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    // replaceState: filtering doesn't add Back-button entries.
    // history.state is passed through, so routers that store data there keep working.
    if (next !== current) window.history.replaceState(window.history.state, "", next)
}
