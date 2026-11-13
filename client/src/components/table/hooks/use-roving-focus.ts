import * as React from "react"

/**
 * Which row is in the tab order, plus a way to move real focus to it after the next render
 * (the row may be on a page that hasn't rendered yet).
 */
export function useRovingFocus() {
    // The row that receives focus when tabbing into the table
    const [focusedRowId, setFocusedRowId] = React.useState<string | null>(null)
    // Bumped to ask for focus on the focused row after the next render (e.g. after a page change)
    const [focusRequest, setFocusRequest] = React.useState(0)

    const requestFocus = React.useCallback((rowId: string) => {
        setFocusedRowId(rowId)
        setFocusRequest((n) => n + 1)
    }, [])

    return { focusedRowId, setFocusedRowId, focusRequest, requestFocus }
}
