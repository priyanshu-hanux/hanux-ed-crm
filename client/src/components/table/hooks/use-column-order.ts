import * as React from "react"

import { partitionColumnIds, resolveColumnOrder } from "../helpers/columns"

/**
 * Column order: pinned columns stay at their edge, the rest can be reordered.
 * `movableOrder` is what the user chose (and what gets saved); `columnOrder` is the full order for TanStack.
 */
export function useColumnOrder({ columns, initialOrder }: { columns: readonly unknown[]; initialOrder: string[] }) {
    const { leftPinnedIds, rightPinnedIds, defaultMovableIds } = React.useMemo(
        () => partitionColumnIds(columns),
        [columns]
    )

    const [movableOrder, setMovableOrder] = React.useState<string[]>(initialOrder)

    const resolveOrder = React.useCallback(
        (order: string[]) => resolveColumnOrder(order, defaultMovableIds),
        [defaultMovableIds]
    )
    const orderedMovableIds = React.useMemo(() => resolveOrder(movableOrder), [resolveOrder, movableOrder])

    const columnOrder = React.useMemo(
        () => [...leftPinnedIds, ...orderedMovableIds, ...rightPinnedIds],
        [leftPinnedIds, orderedMovableIds, rightPinnedIds]
    )

    return { defaultMovableIds, movableOrder, setMovableOrder, resolveOrder, orderedMovableIds, columnOrder }
}
