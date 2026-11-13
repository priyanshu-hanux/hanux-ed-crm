import * as React from "react"

import { SEARCH_DEBOUNCE_MS } from "../config/constants"
import { createGlobalSearchFn } from "../helpers/filter-fns"

/**
 * Toolbar search: what's in the input (instant) vs. what the table filters by (debounced),
 * plus the search function over the searchable columns.
 */
export function useTableSearch({
    initialSearch,
    searchColumns,
    searchKey,
}: {
    initialSearch: string
    searchColumns?: string[]
    searchKey?: string
}) {
    // Keyed by the ids, so a new array with the same ids doesn't rebuild the search cache
    const searchColumnsKey = (searchColumns ?? (searchKey ? [searchKey] : [])).join("|")
    const searchColumnIds = React.useMemo(
        () => (searchColumnsKey ? searchColumnsKey.split("|") : []),
        [searchColumnsKey]
    )
    const globalSearchFn = React.useMemo(() => createGlobalSearchFn(searchColumnIds), [searchColumnIds])

    const [searchInput, setSearchInput] = React.useState(initialSearch)
    const [globalFilter, setGlobalFilter] = React.useState(initialSearch)
    const searchInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        const timer = setTimeout(() => setGlobalFilter(searchInput), SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(timer)
    }, [searchInput])

    /** Sets the input and the applied search at once, skipping the debounce */
    const setSearchNow = React.useCallback((value: string) => {
        setSearchInput(value)
        setGlobalFilter(value)
    }, [])

    // Clear both at once, so the search chip disappears immediately instead of after the debounce
    const clearSearch = React.useCallback(() => setSearchNow(""), [setSearchNow])

    return {
        searchColumnIds,
        globalSearchFn,
        searchInput,
        setSearchInput,
        globalFilter,
        setGlobalFilter,
        setSearchNow,
        clearSearch,
        searchInputRef,
    }
}
