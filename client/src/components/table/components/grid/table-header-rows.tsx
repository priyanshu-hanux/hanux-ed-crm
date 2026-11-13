import { flexRender, type RowData, type Table } from "@tanstack/react-table"

import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cellPaddingClass, labelOf } from "../../helpers/columns"
import type { GetSticky } from "../../hooks/use-sticky-columns"
import type { DataTableFeatures } from "../../types/column"
import { ColumnHeaderLabel, HeaderIconsContext } from "../cells/column-header-label"
import { ColumnResizer } from "./column-resizer"

// The <thead>: one cell per visible column, with pinning and a resize handle
export function TableHeaderRows<TData extends RowData>({
    table,
    getSticky,
    showIcons = true,
}: {
    table: Table<DataTableFeatures, TData>
    getSticky: GetSticky
    /** Show each column's meta.icon before its name */
    showIcons?: boolean
}) {
    return (
        <HeaderIconsContext.Provider value={showIcons}>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                        {headerGroup.headers.map((header) => {
                            const sticky = getSticky(header.column.id, true)
                            const column = header.column

                            return (
                                <TableHead
                                    key={header.id}
                                    data-column-id={column.id}
                                    data-sticky={sticky.side}
                                    data-sticky-edge={sticky.edge}
                                    className={`${cellPaddingClass(column.id)} relative py-1.5 font-medium text-[13px] whitespace-nowrap`}
                                    style={sticky.style}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : typeof column.columnDef.header === "string"
                                            // Plain text header: add the column's icon
                                            ? <ColumnHeaderLabel column={column} title={column.columnDef.header} />
                                            : flexRender(column.columnDef.header, header.getContext())}

                                    {column.getCanResize() && (
                                        <ColumnResizer table={table} header={header} label={labelOf(column)} />
                                    )}
                                </TableHead>
                            )
                        })}
                    </TableRow>
                ))}
            </TableHeader>
        </HeaderIconsContext.Provider>
    )
}
