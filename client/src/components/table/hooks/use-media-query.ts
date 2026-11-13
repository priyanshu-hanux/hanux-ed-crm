import * as React from "react"

/**
 * True while the media query matches. Read synchronously on the first render
 * (no flash of the wrong layout) and kept up to date as the window changes.
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = React.useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia(query)
            list.addEventListener("change", onChange)
            return () => list.removeEventListener("change", onChange)
        },
        [query]
    )
    return React.useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        () => false
    )
}
