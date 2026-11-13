import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CopyValueButton } from "./copy-value-button"
import { EmptyCell } from "./empty-cell"
import { OverflowHoverCard } from "./overflow-hover-card"

export interface TagsCellProps {
    /** The tags, already cleaned (no blanks or duplicates); each is used as a React key */
    tags: readonly string[]
    /** Plural name for labels, e.g. "skills" */
    label: string
    /** How many tags fit in the cell before the "+N" pill. Default 3 */
    max?: number
    /** Text shown when there are no tags. Default "---" */
    emptyText?: React.ReactNode
    className?: string
}

/**
 * Tags (skills, keywords…) as badges. When there are more than `max`, a "+N" pill opens
 * a card with every tag as a wrapped tag cloud, plus a "Copy all" button.
 */
export function TagsCell({ tags, label, max = 3, emptyText, className }: TagsCellProps) {
    if (tags.length === 0) {
        return <EmptyCell>{emptyText}</EmptyCell>
    }

    const visible = tags.slice(0, max)
    const hiddenCount = tags.length - visible.length

    return (
        <div className={cn("flex min-w-0 max-w-full flex-wrap items-center gap-1.5", className)}>
            {visible.map((tag) => (
                <Badge key={tag} variant="outline" className="max-w-full truncate font-normal" title={tag}>
                    {tag}
                </Badge>
            ))}

            {hiddenCount > 0 && (
                <OverflowHoverCard
                    hiddenCount={hiddenCount}
                    title={`${tags.length} ${label}`}
                    triggerLabel={`Show all ${tags.length} ${label}`}
                    headerAction={
                        <CopyValueButton text={tags.join(", ")} label={label} className="-mr-1.5">
                            Copy all
                        </CopyValueButton>
                    }
                    className="w-80"
                    bodyClassName="p-3"
                >
                    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
                        {tags.map((tag) => (
                            <li key={tag} className="max-w-full">
                                {/* Wraps instead of truncating, so a long tag is readable here */}
                                <Badge variant="outline" className="h-auto max-w-full whitespace-normal break-words py-0.5 text-left font-normal">
                                    {tag}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </OverflowHoverCard>
            )}
        </div>
    )
}
