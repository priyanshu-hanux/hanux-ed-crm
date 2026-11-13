import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { SelectionSummary } from "../../helpers/selection"
import { ACCENT_SURFACE } from "./accent-styles"

// How many pages are linked by number before "and N more"
const MAX_PAGE_LINKS = 3

type SelectionContent = {
    // Selected rows visible under the current filters
    selectedRowCount: number
    summary: SelectionSummary
    // Filtered rows across all pages
    matchingRowCount: number
    // Bulk actions for the selected rows
    actions?: React.ReactNode
}

/**
 * The toolbar while rows are selected: "25 selected on this page · Select all 82" on the left,
 * the bulk actions and ✕ on the right. It takes the normal toolbar's place (the table fades
 * between the two), and keeps its last content while it fades out.
 */
export function SelectionToolbar({
    show,
    selectedRowCount,
    summary,
    matchingRowCount,
    actions,
    onGoToPage,
    onSelectAllMatching,
    onClear,
}: SelectionContent & {
    // Rows are selected
    show: boolean
    onGoToPage: (page: number) => void
    onSelectAllMatching: () => void
    onClear: () => void
}) {
    // While fading out, keep the last selection instead of "0 selected" and no buttons
    const live: SelectionContent = { selectedRowCount, summary, matchingRowCount, actions }
    const [last, setLast] = React.useState(live)
    if (
        show &&
        (last.selectedRowCount !== selectedRowCount ||
            last.summary !== summary ||
            last.matchingRowCount !== matchingRowCount ||
            last.actions !== actions)
    ) {
        setLast(live)
    }
    const view = show ? live : last

    return (
        <div role="region" aria-label="Row selection" className="flex w-full min-w-0 items-center gap-3 py-2 pr-2 pl-4">
            <SelectionSummaryText
                {...view}
                onGoToPage={onGoToPage}
                onSelectAllMatching={onSelectAllMatching}
            />

            <div className="ml-auto flex shrink-0 items-center gap-1">
                {view.actions}
                {view.actions && <div className="mx-2 h-6 w-px bg-(--dt-accent)/20" aria-hidden="true" />}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    aria-label="Clear selection"
                    title="Clear selection"
                    className={ACCENT_SURFACE.ghost}
                >
                    <X />
                </Button>
            </div>
        </div>
    )
}

// "25 selected on this page · Select all 82", or where the selection is when it spans pages
function SelectionSummaryText({
    selectedRowCount,
    summary,
    matchingRowCount,
    onGoToPage,
    onSelectAllMatching,
}: SelectionContent & { onGoToPage: (page: number) => void; onSelectAllMatching: () => void }) {
    const { selectedByPage, selectedOnThisPage, otherSelectedPages, hiddenSelectedCount, canSelectAllMatching } = summary

    return (
        <p className="min-w-0 truncate text-sm text-muted-foreground">
            <span className="font-semibold text-(--dt-accent) tabular-nums">{selectedRowCount} selected</span>{" "}
            {otherSelectedPages.length === 0 ? (
                "on this page"
            ) : (
                <>
                    {selectedOnThisPage > 0 && `${selectedOnThisPage} here, `}
                    {selectedRowCount - selectedOnThisPage} on {otherSelectedPages.length === 1 ? "page" : "pages"}{" "}
                    {otherSelectedPages.slice(0, MAX_PAGE_LINKS).map((page, index) => (
                        <React.Fragment key={page}>
                            {index > 0 && ", "}
                            <button
                                type="button"
                                onClick={() => onGoToPage(page)}
                                className="rounded font-medium text-foreground underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                aria-label={`Go to page ${page} (${selectedByPage.get(page)} selected)`}
                            >
                                {page}
                            </button>
                        </React.Fragment>
                    ))}
                    {otherSelectedPages.length > MAX_PAGE_LINKS && ` and ${otherSelectedPages.length - MAX_PAGE_LINKS} more`}
                </>
            )}
            {canSelectAllMatching && (
                <>
                    {" · "}
                    <button
                        type="button"
                        onClick={onSelectAllMatching}
                        className="rounded font-medium text-(--dt-accent) underline underline-offset-4 hover:no-underline focus-visible:ring-2 focus-visible:ring-(--dt-accent)/40 focus-visible:outline-none"
                    >
                        Select all {matchingRowCount}
                    </button>
                </>
            )}
            {hiddenSelectedCount > 0 && (
                <span title="Selected rows the search or filters hide aren't included in actions">
                    {" · "}
                    <span className="text-amber-600 dark:text-amber-500">{hiddenSelectedCount} hidden by filters</span>
                </span>
            )}
        </p>
    )
}
