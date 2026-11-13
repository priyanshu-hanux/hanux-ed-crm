import * as React from "react"
import type { ColumnVisibilityState, Updater } from "@tanstack/react-table"

/**
 * Column visibility, controlled (columnVisibility + onColumnVisibilityChange) or internal.
 * Restores the saved visibility before the first paint, on top of the defaults,
 * so hidden columns don't flash and columns added later still get their default.
 */
export function useColumnVisibility({
    columnVisibility: externalVisibility,
    onColumnVisibilityChange,
    defaultColumnVisibility,
    storedVisibility,
}: {
    columnVisibility?: ColumnVisibilityState
    onColumnVisibilityChange?: (visibility: ColumnVisibilityState) => void
    defaultColumnVisibility?: ColumnVisibilityState
    storedVisibility?: ColumnVisibilityState
}) {
    // Uncontrolled: start from the defaults, with the saved visibility on top, right away
    const [internalVisibility, setInternalVisibility] = React.useState<ColumnVisibilityState>(() =>
        externalVisibility === undefined ? { ...defaultColumnVisibility, ...storedVisibility } : {}
    )
    const columnVisibility = externalVisibility ?? internalVisibility

    const setColumnVisibility = React.useCallback(
        (updaterOrValue: Updater<ColumnVisibilityState>) => {
            if (onColumnVisibilityChange) {
                onColumnVisibilityChange(
                    typeof updaterOrValue === "function" ? updaterOrValue(externalVisibility ?? {}) : updaterOrValue
                )
            } else {
                setInternalVisibility(updaterOrValue)
            }
        },
        [onColumnVisibilityChange, externalVisibility]
    )

    // Captured once, so later changes (like "Show all") don't become the new default
    const [initialVisibility] = React.useState<ColumnVisibilityState>(() => externalVisibility ?? {})

    // Controlled: hand the saved visibility to the parent before the first paint
    React.useLayoutEffect(() => {
        if (storedVisibility && onColumnVisibilityChange) {
            onColumnVisibilityChange({ ...initialVisibility, ...storedVisibility })
        }
        // Once, on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const defaultVisibility = defaultColumnVisibility ?? initialVisibility

    return { columnVisibility, setColumnVisibility, defaultVisibility }
}
