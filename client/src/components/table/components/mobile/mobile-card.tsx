import type * as React from "react"
import type { Row, RowData } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { DataTableFeatures } from "../../types/column"
import type { DataTableAction, DataTableCardField, DataTableCardFields } from "../../types/data-table"

// A card field's value: the row property it names, or what its function returns
function resolveField<TData>(rowData: TData, field: DataTableCardField<TData> | undefined): React.ReactNode {
    if (field === undefined) return null
    const value = typeof field === "function" ? field(rowData) : rowData[field]
    if (value == null || value === "") return null
    return typeof value === "object" && !Array.isArray(value) && !("$$typeof" in (value as object))
        ? null // a plain object can't be shown as text
        : (value as React.ReactNode)
}
import { getVisibleActions, RowActionsMenu } from "../cells/row-actions-menu"

// One row as a card, for narrow screens
export function MobileCard<TData extends RowData>({
    row,
    cardFields,
    actions,
    selectable,
    clickable,
    isActive,
    onClick,
}: {
    row: Row<DataTableFeatures, TData>
    cardFields: DataTableCardFields<TData>
    actions: DataTableAction<TData>[]
    // Show the selection checkbox
    selectable: boolean
    // Rows open the details drawer
    clickable: boolean
    // This row's details drawer is open
    isActive: boolean
    onClick: (event: React.MouseEvent) => void
}) {
    const rowData = row.original
    const visibleActions = getVisibleActions(actions, rowData)
    const title = resolveField(rowData, cardFields.title)
    const subtitle = resolveField(rowData, cardFields.subtitle)
    const badge = resolveField(rowData, cardFields.badge)
    const description = resolveField(rowData, cardFields.description)

    return (
        <Card
            onClick={onClick}
            className={cn("mb-4", clickable && "cursor-pointer", isActive && "ring-2 ring-ring/40")}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        {selectable && (
                            <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(value) => row.toggleSelected(!!value)}
                                aria-label="Select row"
                            />
                        )}
                        {cardFields.image && (() => {
                            const imageData = rowData[cardFields.image]
                            const imageUrl = Array.isArray(imageData) ? imageData[0] : imageData
                            return imageUrl && String(imageUrl).trim() !== '' ? (
                                <div className="relative h-12 w-12 rounded-md overflow-hidden shrink-0">
                                    <img
                                        src={imageUrl as string}
                                        alt={typeof title === "string" ? title : ""}
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : null
                        })()}
                        <div>
                            <CardTitle className="text-base">
                                {title}
                            </CardTitle>
                            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                        </div>
                    </div>
                    <RowActionsMenu row={rowData} actions={visibleActions} />
                </div>
                {badge && (
                    <Badge variant="secondary" className="w-fit">
                        {badge}
                    </Badge>
                )}
            </CardHeader>
            {description && (
                <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
            )}
        </Card>
    )
}
