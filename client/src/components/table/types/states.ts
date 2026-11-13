import type * as React from "react"

/** A button in a table state, e.g. "Clear filters" or "Add candidate" */
export interface TableStateAction {
    label: string
    onClick?: () => void
    /** Renders a link instead of a button */
    href?: string
    icon?: React.ComponentType<{ className?: string }>
    /** Default: "outline" (the first action of the empty state: "default") */
    variant?: "default" | "outline" | "ghost" | "secondary"
    /** Shows a spinner and disables the button, e.g. while retrying */
    loading?: boolean
}

/** What a table state shows. Everything except the title is optional. */
export interface TableStateConfig {
    icon?: React.ComponentType<{ className?: string }>
    title: React.ReactNode
    description?: React.ReactNode
    actions?: TableStateAction[]
    /** "destructive" colors the icon red (errors) */
    tone?: "default" | "destructive"
}

/** The situations the table can be in when it has no rows to show */
export type TableStateKind =
    /** Loading finished and there is no data at all */
    | "empty"
    /** There is data, but the search or filters match none of it */
    | "noResults"
    /** The first load failed */
    | "error"
    /** Every column is hidden in the Columns dialog */
    | "noColumns"

/** Facts about the current situation, for state configs written as functions */
export interface TableStateContext {
    /** The applied search text ("" when none) */
    search: string
    /** How many column filters are active */
    filterCount: number
    /** The error message, for the "error" state */
    errorMessage?: string
    /** The default config for this state, to extend instead of replace */
    defaults: TableStateConfig
}

/**
 * How to show one state:
 * - a partial config, merged over the default ({ title: "No candidates yet", actions: [...] })
 * - a function returning one, when it depends on the search, filters or error
 * - any React node, to render your own content
 * - false, to fall back to a plain one-line message
 */
export type TableStateOption =
    | Partial<TableStateConfig>
    | ((context: TableStateContext) => Partial<TableStateConfig>)
    | React.ReactElement
    | false

/** The `states` prop of <DataTable /> */
export type DataTableStates = Partial<Record<TableStateKind, TableStateOption>>

/** Names for the rows, used in the default texts: { singular: "candidate", plural: "candidates" } */
export interface TableItemName {
    singular: string
    plural: string
}
