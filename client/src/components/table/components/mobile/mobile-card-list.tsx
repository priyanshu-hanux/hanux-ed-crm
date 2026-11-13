import type * as React from "react"
import type { Row, RowData } from "@tanstack/react-table"

import { Card, CardContent } from "@/components/ui/card"
import type { DataTableFeatures } from "../../types/column"
import type { DataTableAction, DataTableCardFields } from "../../types/data-table"
import type { ResolvedTableState } from "../../helpers/table-states"
import { ResolvedTableStateView } from "../states/table-state-view"
import { SkeletonCards } from "../states/skeleton"
import { MobileCard } from "./mobile-card"

// The mobile layout: skeleton cards, an error card, row cards or an empty card
export function MobileCardList<TData extends RowData>({
    rows,
    cardFields,
    actions,
    selectable,
    clickable,
    activeRowId,
    onRowClick,
    showSkeleton,
    state,
}: {
    rows: Row<DataTableFeatures, TData>[]
    // Without it, rows aren't rendered as cards
    cardFields?: DataTableCardFields<TData>
    actions: DataTableAction<TData>[]
    selectable: boolean
    clickable: boolean
    activeRowId: string | null
    onRowClick: (event: React.MouseEvent, rowId: string) => void
    showSkeleton: boolean
    /** What to show instead of cards (no data, no matches, load failed); null = show the cards */
    state: ResolvedTableState | null
}) {
    return (
        <div className="md:hidden">
            {showSkeleton ? (
                <SkeletonCards />
            ) : state && state.kind !== "noColumns" ? (
                // Cards don't depend on visible columns, so "all columns hidden" doesn't apply here
                <Card>
                    <CardContent className="py-10">
                        <ResolvedTableStateView state={state} />
                    </CardContent>
                </Card>
            ) : (
                cardFields &&
                rows.map((row) => (
                    <MobileCard
                        key={row.id}
                        row={row}
                        cardFields={cardFields}
                        actions={actions}
                        selectable={selectable}
                        clickable={clickable}
                        isActive={row.id === activeRowId}
                        onClick={(event) => onRowClick(event, row.id)}
                    />
                ))
            )}
        </div>
    )
}
