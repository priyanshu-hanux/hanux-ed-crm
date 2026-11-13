import * as React from "react"
import { ChevronDown, ListChecks, SquareCheck, SquareStack, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { DataTableSelectionPreset } from "../../types/bulk-actions"

/**
 * The toolbar's "Select" menu: select this page, every matching row, or the rows a preset
 * describes ("Missing email"…). Presets look at the rows that match the current search and
 * filters, across all pages, and replace the current selection.
 */
export function SelectionMenu<TData>({
    presets,
    matchingRows,
    pageRowCount,
    selectedCount,
    onSelectPage,
    onSelectAllMatching,
    onSelectWhere,
    onClear,
    showEmpty = false,
}: {
    presets: DataTableSelectionPreset<TData>[]
    // Rows matching the search and filters, all pages
    matchingRows: TData[]
    pageRowCount: number
    selectedCount: number
    onSelectPage: () => void
    onSelectAllMatching: () => void
    // Replace the selection with the matching rows this test accepts
    onSelectWhere: (match: (row: TData) => boolean) => void
    onClear: () => void
    // Also list presets with no matching rows (shown disabled). Default: hidden
    showEmpty?: boolean
}) {
    const [open, setOpen] = React.useState(false)
    // Counted only while the menu is open, so large tables don't pay for it on every render
    const counts = React.useMemo(
        () => (open ? presets.map((preset) => matchingRows.filter(preset.match).length) : []),
        [open, presets, matchingRows]
    )
    // A preset with nothing to select is a dead end, so by default only the useful ones are listed
    const visiblePresets = presets
        .map((preset, index) => ({ preset, count: counts[index] ?? 0 }))
        .filter(({ count }) => showEmpty || count > 0)

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="shrink-0 gap-2 max-sm:px-2.5" aria-label="Select rows">
                    <ListChecks className="size-4" />
                    <span className="hidden sm:inline">Select</span>
                    <ChevronDown className="hidden size-3.5 opacity-60 sm:inline" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-1.5">
                <DropdownMenuGroup>
                    <MenuLabel>Quick select</MenuLabel>
                    <MenuRow icon={SquareCheck} label="This page" count={pageRowCount} onSelect={onSelectPage} />
                    <MenuRow
                        icon={SquareStack}
                        label="All matching rows"
                        hint={matchingRows.length > pageRowCount ? "every page" : undefined}
                        count={matchingRows.length}
                        onSelect={onSelectAllMatching}
                    />
                </DropdownMenuGroup>

                {visiblePresets.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="my-1.5" />
                        <DropdownMenuGroup>
                            <MenuLabel>By condition</MenuLabel>
                            {/* Long lists scroll instead of growing past the screen */}
                            <div className="-mx-1.5 max-h-72 overflow-y-auto px-1.5">
                                {visiblePresets.map(({ preset, count }) => (
                                    <MenuRow
                                        key={preset.id}
                                        icon={preset.icon}
                                        label={preset.label}
                                        hint={preset.description}
                                        count={count}
                                        onSelect={() => onSelectWhere(preset.match)}
                                    />
                                ))}
                            </div>
                        </DropdownMenuGroup>
                    </>
                )}

                {selectedCount > 0 && (
                    <>
                        <DropdownMenuSeparator className="my-1.5" />
                        <DropdownMenuItem onSelect={onClear} className="gap-2.5 text-muted-foreground">
                            <X />
                            <span className="flex-1">Clear selection</span>
                            <span className="text-xs tabular-nums">{selectedCount}</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function MenuLabel({ children }: { children: React.ReactNode }) {
    return (
        <DropdownMenuLabel className="px-2 pt-1 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {children}
        </DropdownMenuLabel>
    )
}

// One line: icon, label, a short grey hint, and the row count on the right
function MenuRow({
    icon: Icon,
    label,
    hint,
    count,
    onSelect,
}: {
    icon?: React.ComponentType<{ className?: string }>
    label: string
    hint?: string
    count: number
    onSelect: () => void
}) {
    return (
        <DropdownMenuItem disabled={count === 0} onSelect={onSelect} title={hint} className="h-8 gap-2.5">
            {Icon ? <Icon className="text-muted-foreground" /> : <span className="size-4" aria-hidden="true" />}
            <span className="shrink-0">{label}</span>
            {hint && <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{hint}</span>}
            <span
                className={cn(
                    "ml-auto min-w-7 shrink-0 rounded-full bg-muted px-1.5 py-px text-center text-[11px] font-medium tabular-nums text-muted-foreground",
                    "group-focus/dropdown-menu-item:bg-background"
                )}
            >
                {count}
            </span>
        </DropdownMenuItem>
    )
}
