import type * as React from "react"

/**
 * A button of your own in the table's toolbar ("Import", "Find duplicates"…).
 * Most belong in the "More" menu so the toolbar stays calm as features are added;
 * give the few everyday ones `placement: "toolbar"`.
 */
export interface DataTableToolbarAction {
    /** Stable id */
    id: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    /** "toolbar" = a button next to Filters, "menu" = inside "More". Default: "menu" */
    placement?: "toolbar" | "menu"
    /** Menu only: items with the same group sit together, with a divider between groups */
    group?: string
    /** Menu only: a red item, separated from the rest */
    destructive?: boolean
    /** Keyboard hint shown in the menu, e.g. "⌘I". Display only */
    shortcut?: string
    disabled?: boolean
    hidden?: boolean
    onSelect: () => void
}
