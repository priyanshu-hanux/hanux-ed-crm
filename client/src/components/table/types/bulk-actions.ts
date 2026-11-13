import type * as React from "react"

type Icon = React.ComponentType<{ className?: string }>

/** Button styles for bulk actions, the same names as the Button component's variants */
export type BulkActionVariant = "ghost" | "outline" | "secondary" | "default" | "destructive"

/** A choice inside a bulk action, e.g. one executive in "Assign to…" */
export interface BulkActionOption {
    value: string
    label: string
    /** Second line, e.g. "12 open leads" */
    description?: string
    icon?: Icon
}

/** Context passed to a bulk action when it runs */
export interface BulkActionContext {
    /** The option picked from the action's menu (only for actions with `options`) */
    option?: BulkActionOption
    /** Unticks every row */
    clearSelection: () => void
    /** Downloads the selected rows as CSV, with the table's visible columns (same as Export → Selected rows) */
    exportCsv: () => void
}

/**
 * An operation on the selected rows, shown in the selection bar while rows are selected.
 * The table only shows it and calls `onRun`; what it does (API call, toast…) is up to you.
 */
export interface DataTableBulkAction<TData> {
    /** Stable id */
    id: string
    label: string
    icon?: Icon
    /** Show only the icon (the label becomes its tooltip), e.g. for Delete. Needs an icon */
    iconOnly?: boolean
    /**
     * Extra classes for the button in the selection toolbar, merged last so they win over the
     * variant's (e.g. "text-emerald-600 hover:bg-emerald-500/10"). Not used when the action is in ⋯.
     */
    className?: string
    /**
     * How the button looks, same as <Button variant>: "ghost" (plain text, the default), "outline",
     * "secondary", "default" (filled, for the main action) or "destructive" (soft red fill).
     */
    variant?: BulkActionVariant
    /**
     * A dangerous action (delete, archive…): red text, a red confirm button, "This can't be undone"
     * in the default confirmation, and last in the ⋯ menu. Works with any variant.
     * Default: true when variant is "destructive"
     */
    destructive?: boolean
    /**
     * Turns the button into a menu of choices (executives, statuses…); onRun gets the picked one.
     * A function receives the selected rows, e.g. to mark the status they already have.
     */
    options?: BulkActionOption[] | ((rows: TData[]) => BulkActionOption[])
    /** Heading of the options menu. Default: the label */
    optionsTitle?: string
    /**
     * Ask before running. The function form gets the rows and the picked option, for texts like
     * "Assign 3 candidates to Ananya?". `true` uses a generic confirmation.
     */
    confirm?: boolean | BulkActionConfirm | ((rows: TData[], option?: BulkActionOption) => BulkActionConfirm)
    /**
     * Return a reason (shown as a tooltip) or true to disable the action for this selection,
     * e.g. (rows) => rows.length < 2 && "Select at least 2 to merge"
     */
    disabled?: (rows: TData[]) => boolean | string | undefined | null
    /** Hide the action for this selection */
    hidden?: (rows: TData[]) => boolean
    /** Untick the rows after a successful run. Default: true */
    clearSelectionAfter?: boolean
    /** Do the work. Return a promise to show a spinner until it settles; throw to keep the selection. */
    onRun: (rows: TData[], context: BulkActionContext) => void | Promise<void>
}

export interface BulkActionConfirm {
    title: React.ReactNode
    description?: React.ReactNode
    /** Default: the action's label */
    confirmLabel?: string
    /** Red confirm button. Default: true for "destructive" actions */
    destructive?: boolean
}

/**
 * A quick way to select rows that share something ("Missing email", "Status: New"),
 * from the Select menu in the toolbar. It looks at the rows that match the current
 * search and filters, on every page.
 */
export interface DataTableSelectionPreset<TData> {
    id: string
    label: string
    /** A few grey words after the label, e.g. "≤ 1 year" (full text on hover) */
    description?: string
    icon?: Icon
    /** Which rows it selects */
    match: (row: TData) => boolean
}
