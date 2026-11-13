import type * as React from "react"

import { Card, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ACTIONS_COLUMN_ID, SELECT_COLUMN_ID } from "../../config/constants"
import type { SkeletonVariant } from "../../types/column"

export function SkeletonBar({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            aria-hidden="true"
            className={cn("animate-pulse rounded bg-muted motion-reduce:animate-none", className)}
            style={style}
        />
    )
}

// Varied widths so the placeholder looks like real content, not a grid of identical bars
const SKELETON_WIDTHS = ["72%", "56%", "84%", "64%", "48%"]

// Placeholder for one cell, shaped by the column's meta.skeleton
export function SkeletonCellContent({
    columnId,
    variant = "text",
    row,
    col,
}: {
    columnId: string
    variant?: SkeletonVariant
    row: number
    col: number
}) {
    if (columnId === SELECT_COLUMN_ID) {
        return (
            <div className="flex justify-center">
                <SkeletonBar className="size-4 rounded-lg" />
            </div>
        )
    }
    if (columnId === ACTIONS_COLUMN_ID) {
        return (
            <div className="flex justify-center">
                <SkeletonBar className="h-1.5 w-5 rounded-full" />
            </div>
        )
    }
    if (variant === "none") return null

    const width = SKELETON_WIDTHS[(row + col) % SKELETON_WIDTHS.length]
    if (variant === "avatar") {
        return (
            <div className="flex items-center gap-3">
                <SkeletonBar className="size-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                    <SkeletonBar className="h-3" style={{ width }} />
                    <SkeletonBar className="h-2.5 w-[45%]" />
                </div>
            </div>
        )
    }
    if (variant === "badge") return <SkeletonBar className="h-5 w-16 rounded-full" />
    return <SkeletonBar className="h-3" style={{ width }} />
}

// Placeholder cards for the mobile layout
export function SkeletonCards({ count = 3 }: { count?: number }) {
    return Array.from({ length: count }, (_, index) => (
        <Card key={index} className="mb-4" aria-hidden="true">
            <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                    <SkeletonBar className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBar className="h-4 w-2/5" />
                        <SkeletonBar className="h-3 w-3/5" />
                    </div>
                </div>
            </CardHeader>
        </Card>
    ))
}
