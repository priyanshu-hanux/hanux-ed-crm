import type * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

/** Keys typed here never step through rows */
const NO_STEP_SELECTOR = "input, textarea, select, [contenteditable='true'], [role='menu'], [role='listbox']"

/** Side panel with one row's details; ↑/↓ (keys or buttons) step through the matching rows */
export function DetailsDrawer<TData>({
    row,
    index,
    total,
    onStep,
    onClose,
    onCloseAutoFocus,
    title,
    description,
    children,
}: {
    /** The open row, or undefined when the drawer is closed */
    row: TData | undefined
    /** Position of the row among the matching rows (0-based) */
    index: number
    total: number
    onStep: (delta: number) => void
    onClose: () => void
    onCloseAutoFocus?: (event: Event) => void
    title?: (row: TData) => React.ReactNode
    description?: (row: TData) => React.ReactNode
    children: (row: TData) => React.ReactNode
}) {
    return (
        <Sheet
            open={row !== undefined}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
        >
            <SheetContent
                side="right"
                className="flex flex-col gap-0 p-0 w-full! sm:max-w-xl!"

                onCloseAutoFocus={onCloseAutoFocus}
                // ↑/↓ step through rows, except while typing or inside a menu
                onKeyDown={(event) => {
                    const target = event.target as HTMLElement
                    if (target.closest(NO_STEP_SELECTOR)) return;
                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        onStep(1);
                    } else if (event.key === "ArrowUp") {
                        event.preventDefault();
                        onStep(-1);
                    }
                }}
            >
                {row !== undefined && (
                    <>
                        <SheetHeader className="space-y-1 border-b px-5 py-4 text-left">
                            <div className="flex items-center gap-2">
                                <span className="text-xs tabular-nums text-muted-foreground">
                                    {index + 1} of {total}
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => onStep(-1)}
                                        disabled={index <= 0}
                                        aria-label="Previous row"
                                        title="Previous (↑)"
                                    >
                                        <ChevronUp className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => onStep(1)}
                                        disabled={index >= total - 1}
                                        aria-label="Next row"
                                        title="Next (↓)"
                                    >
                                        <ChevronDown className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <SheetTitle className="truncate text-lg">
                                {title?.(row) ?? "Details"}
                            </SheetTitle>
                            {description ? (
                                <SheetDescription className="truncate">
                                    {description(row)}
                                </SheetDescription>
                            ) : (
                                <SheetDescription className="sr-only">Row details</SheetDescription>
                            )}
                        </SheetHeader>

                        <div className="scroll-thin flex-1 overflow-y-auto">
                            {children(row)}
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
