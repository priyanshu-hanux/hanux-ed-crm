/* ---------------------------------------------------------------------- */
/* Public API of the data table. Import from "@/components/table".         */
/* ---------------------------------------------------------------------- */

// Component
export { DataTable } from "./data-table"

// Column builders: describe where each value comes from, get a full column (see column-builders.tsx)
export {
    customColumn,
    listColumn,
    numberColumn,
    tagsColumn,
    textColumn,
    type BaseColumnOptions,
    type CustomColumnOptions,
    type ListColumnOptions,
    type NumberColumnOptions,
    type TagsColumnOptions,
    type TextColumnOptions,
} from "./components/columns/column-builders"

// Column helpers
export { createSortableHeader } from "./components/cells/sortable-header"
export { EmptyCell } from "./components/cells/empty-cell"

// Table states (no data, no matches, load failed…), also usable outside the table
export { TableStateView } from "./components/states/table-state-view"
export { MultiValueCell, type MultiValueCellProps } from "./components/cells/multi-value-cell"
// For your own header components: the column's icon + title, matching the built-in headers
export { ColumnHeaderLabel, ColumnIcon } from "./components/cells/column-header-label"
export { TagsCell, type TagsCellProps } from "./components/cells/tags-cell"
// Building blocks for your own multi-value cells (see leads/table/certifications-cell.tsx)
export { OverflowHoverCard, type OverflowHoverCardProps } from "./components/cells/overflow-hover-card"
export { CopyValueButton } from "./components/cells/copy-value-button"
export { dataTableFeatures } from "./config/features"

// Helpers that are useful outside the table (e.g. in a details drawer)
export { copyToClipboard } from "./helpers/clipboard"
export { buildCsv, csvFilename, downloadFile } from "./helpers/export-csv"
export { normalizeText, toNumber } from "./helpers/filter-fns"

// Types
export type * from "./types"
