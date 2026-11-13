import type * as React from "react"
import { Keyboard } from "lucide-react"

import { Field, FieldLabel } from "@/components/ui/field"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getPageItems } from "../../helpers/pagination"
import type { TablePagination } from "../../hooks/use-table-pagination"

// Footer: "Showing x–y of z", page links and the rows-per-page select 
export function DataTablePagination({
    pagination,
    status,
    showPageLinks,
    onShowShortcuts,
}: {
    pagination: TablePagination
    // Overrides the "Showing…" text, e.g. "Loading…" ("" hides it) 
    status?: string
    // false while loading or after a failed load 
    showPageLinks: boolean
    // Shows the "Shortcuts" button when provided 
    onShowShortcuts?: () => void
}) {
    const {
        pageNumber,
        pageCount,
        pageSize,
        totalCount,
        canPreviousPage,
        canNextPage,
        canJumpToPage,
        canChangePageSize,
        rangeStart,
        rangeEnd,
        sizeChoices,
        goToPage,
        changePageSize,
    } = pagination

    // shadcn's links are <a> elements: keep href="#" so they stay keyboard-focusable,
    // but stop the navigation and handle the click ourselves
    const pageLinkProps = (page: number, enabled = true) => ({
        href: "#",
        onClick: (event: React.MouseEvent) => {
            event.preventDefault()
            if (enabled) goToPage(page)
        },
        "aria-disabled": enabled ? undefined : true,
        tabIndex: enabled ? undefined : -1,
        className: enabled ? undefined : "pointer-events-none opacity-50",
    })

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground sm:justify-start">
                <span>
                    {status ?? (totalCount === 0 ? "No results" : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`)}
                </span>
                {onShowShortcuts && (
                    <button
                        type="button"
                        onClick={onShowShortcuts}
                        className="hidden items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
                    >
                        <Keyboard className="size-3.5" />
                        Shortcuts
                    </button>
                )}
            </div>

            {pageCount > 1 && showPageLinks && (
                <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious size={'xs'}  {...pageLinkProps(pageNumber - 1, canPreviousPage)} />
                        </PaginationItem>

                        {canJumpToPage ? (
                            getPageItems(pageNumber, pageCount).map((item) =>
                                typeof item === "number" ? (
                                    <PaginationItem key={item}>
                                        <PaginationLink
                                            {...pageLinkProps(item)}
                                            isActive={item === pageNumber}
                                            aria-label={`Page ${item}`}
                                            size="xs"
                                            className="rounded-sm bg-accent text-accent-foreground aria-[current=page]:bg-accent-foreground aria-[current=page]:text-accent aria-[current=page]:hover:bg-accent-foreground/90"
                                        >
                                            {item}
                                        </PaginationLink>
                                    </PaginationItem>
                                ) : (
                                    <PaginationItem key={item}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )
                            )
                        ) : (
                            <PaginationItem>
                                <span className="px-2 text-xs text-muted-foreground">
                                    Page {pageNumber} of {pageCount}
                                </span>
                            </PaginationItem>
                        )}

                        <PaginationItem>
                            <PaginationNext size={'xs'}  {...pageLinkProps(pageNumber + 1, canNextPage)} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {canChangePageSize && (
                <Field orientation="horizontal" className="w-fit">
                    <FieldLabel htmlFor="data-table-page-size" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Rows per page
                    </FieldLabel>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) => changePageSize(Number(value))}
                    >
                        <SelectTrigger size="sm" className="w-20" id="data-table-page-size">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end" position="popper">
                            <SelectGroup>
                                {sizeChoices.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </Field>
            )}
        </div>
    )
}
