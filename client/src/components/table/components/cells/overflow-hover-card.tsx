import * as React from "react"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

export interface OverflowHoverCardProps {
    /** How many values the cell is hiding; shown on the pill as "+N" */
    hiddenCount: number
    /** Card heading, e.g. "15 skills" */
    title: React.ReactNode
    /** Screen-reader text for the pill, e.g. "Show all 15 skills" */
    triggerLabel: string
    /** Optional control on the right of the heading, e.g. a "Copy all" button */
    headerAction?: React.ReactNode
    /** Width and other classes for the card */
    className?: string
    /** Classes for the scrolling body (e.g. padding for a tag cloud, none for a divided list) */
    bodyClassName?: string
    children: React.ReactNode
}

/**
 * The "+N" pill a cell shows when it can't fit all its values, and the card that opens
 * when you hover or focus it. Every multi-value cell (contacts, tags, certifications…) uses
 * this, so they open, look and behave the same; only the card's body differs.
 */
export function OverflowHoverCard({
    hiddenCount,
    title,
    triggerLabel,
    headerAction,
    className,
    bodyClassName,
    children,
}: OverflowHoverCardProps) {
    return (
        <HoverCard openDelay={150} closeDelay={100}>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    // Clicking the pill shouldn't open the row's details drawer
                    onClick={(event) => event.stopPropagation()}
                    aria-label={triggerLabel}
                    className="inline-flex h-5 shrink-0 items-center rounded-full border bg-muted/60 px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground"
                >
                    +{hiddenCount}
                </button>
            </HoverCardTrigger>
            <HoverCardContent
                align="start"
                collisionPadding={12}
                className={cn("w-72 overflow-hidden p-0", className)}
                data-no-row-click=""
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex min-h-9 items-center justify-between gap-2 border-b bg-muted/30 px-3 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{title}</p>
                    {headerAction}
                </div>
                <div className={cn("scroll-thin max-h-72 overflow-y-auto", bodyClassName)}>{children}</div>
            </HoverCardContent>
        </HoverCard>
    )
}
