import * as React from "react"

import { cn } from "@/lib/utils"
import { CopyValueButton } from "./copy-value-button"
import { EmptyCell } from "./empty-cell"
import { OverflowHoverCard } from "./overflow-hover-card"

export interface MultiValueCellProps {
    /** All values; the first is treated as primary. Empty strings are ignored. */
    values: readonly string[] | null | undefined
    /** Singular name used in labels, e.g. "email" or "phone number" */
    label: string
    /** Link for a value, e.g. value => `mailto:${value}`. Values render as plain text without it. */
    getHref?: (value: string) => string | undefined
    /** Text to copy for a value. Default: the value itself */
    getCopyText?: (value: string) => string
    /** How a value is displayed. Default: the value itself */
    renderValue?: (value: string) => React.ReactNode
    /** Small tag shown next to a value in the card, e.g. "Work" or "Personal" */
    getTag?: (value: string) => string | undefined
    /** Text shown when there are no values. Default "---" */
    emptyText?: React.ReactNode
    className?: string
}

/**
 * Shows the primary value of a contact-style field (emails, phones, …) and a "+N" pill.
 * Hovering or focusing the pill lists every value, each with a copy button.
 */
export function MultiValueCell({
    values,
    label,
    getHref,
    getCopyText = (value) => value,
    renderValue = (value) => value,
    getTag,
    emptyText,
    className,
}: MultiValueCellProps) {
    const items = (values ?? []).map((value) => value.trim()).filter(Boolean)

    if (items.length === 0) {
        return <EmptyCell>{emptyText}</EmptyCell>
    }

    const [primary, ...others] = items

    return (
        <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
            <span className="min-w-0 truncate" title={primary}>
                {renderValue(primary)}
            </span>

            {others.length > 0 && (
                <OverflowHoverCard
                    hiddenCount={others.length}
                    title={`${items.length} ${label}s`}
                    triggerLabel={`Show all ${items.length} ${label}s`}
                >
                    <ul className="divide-y">
                        {items.map((value, index) => {
                            const href = getHref?.(value)
                            return (
                                <li key={`${value}-${index}`} className="flex items-center gap-2 px-3 py-1.5">
                                    <div className="min-w-0 flex-1">
                                        {href ? (
                                            <a
                                                href={href}
                                                className="block truncate text-[13px] text-foreground underline-offset-4 hover:underline"
                                                title={value}
                                            >
                                                {renderValue(value)}
                                            </a>
                                        ) : (
                                            <span className="block truncate text-[13px]" title={value}>
                                                {renderValue(value)}
                                            </span>
                                        )}
                                    </div>
                                    {getTag?.(value) && (
                                        <span className="shrink-0 text-[10px] text-muted-foreground">{getTag(value)}</span>
                                    )}
                                    {index === 0 && (
                                        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                                            Primary
                                        </span>
                                    )}
                                    <CopyValueButton text={getCopyText(value)} label={label} />
                                </li>
                            )
                        })}
                    </ul>
                </OverflowHoverCard>
            )}
        </div>
    )
}
