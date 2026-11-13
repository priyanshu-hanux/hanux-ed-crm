import * as React from "react"
import { ChevronDown, Loader2, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { BulkActionConfirm, BulkActionOption, DataTableBulkAction } from "../../types/bulk-actions"
import { ACCENT_SURFACE, DESTRUCTIVE_TONE } from "./accent-styles"
import type { TableItemName } from "../../types/states"

/** Buttons shown before the rest go into "More" */
const DEFAULT_MAX_VISIBLE = 3
/** Options lists longer than this get a search box */
const SEARCH_OPTIONS_FROM = 7

type PendingRun<TData> = { action: DataTableBulkAction<TData>; option?: BulkActionOption; confirm: BulkActionConfirm }

/**
 * The operations for the selected rows, in the selection bar. Each action comes from the
 * table's `bulkActions`; this only shows them, asks for an option or a confirmation when
 * the action wants one, and calls its onRun with the selected rows.
 */
export function BulkActions<TData>({
    actions,
    rows,
    itemName,
    clearSelection,
    exportCsv,
    maxVisible = DEFAULT_MAX_VISIBLE,
}: {
    actions: DataTableBulkAction<TData>[]
    /** The selected rows the actions apply to (visible under the current filters) */
    rows: TData[]
    itemName: TableItemName
    clearSelection: () => void
    /** Downloads the selected rows as CSV (passed to actions as context.exportCsv) */
    exportCsv: () => void
    /** Buttons before the rest go into "More" (fewer on small screens) */
    maxVisible?: number
}) {
    const [runningId, setRunningId] = React.useState<string | null>(null)
    const [pending, setPending] = React.useState<PendingRun<TData> | null>(null)

    const visible = actions.filter((action) => !action.hidden?.(rows))
    if (visible.length === 0 || rows.length === 0) return null

    const count = `${rows.length} ${rows.length === 1 ? itemName.singular : itemName.plural}`

    const run = async (action: DataTableBulkAction<TData>, option?: BulkActionOption) => {
        setRunningId(action.id)
        try {
            await action.onRun(rows, { option, clearSelection, exportCsv })
            if (action.clearSelectionAfter !== false) clearSelection()
        } catch (error) {
            // Keep the selection so the user can try again
            toast.error(error instanceof Error && error.message ? error.message : `Couldn’t ${action.label.toLowerCase()}.`)
        } finally {
            setRunningId(null)
        }
    }

    /** Runs right away, or opens the confirmation first */
    const start = (action: DataTableBulkAction<TData>, option?: BulkActionOption) => {
        const confirm = resolveConfirm(action, rows, option, count)
        if (confirm) setPending({ action, option, confirm })
        else void run(action, option)
    }

    const limit = Math.max(1, maxVisible)
    const shown = visible.slice(0, visible.length > limit ? Math.max(1, limit - 1) : limit)
    const overflow = visible.slice(shown.length)

    return (
        <div className="flex items-center gap-1" role="group" aria-label={`Actions for ${count}`}>
            {shown.map((action) => (
                <BulkActionButton
                    key={action.id}
                    action={action}
                    rows={rows}
                    running={runningId === action.id}
                    busy={runningId !== null}
                    onStart={start}
                />
            ))}

            {overflow.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={ACCENT_SURFACE.ghost}
                            disabled={runningId !== null}
                            aria-label="More actions"
                            title="More actions"
                        >
                            <MoreHorizontal aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-48">
                        {overflow.map((action) => {
                            const reason = disabledReason(action, rows)
                            const options = resolveOptions(action, rows)
                            const Icon = action.icon
                            if (options) {
                                return (
                                    <DropdownMenuSub key={action.id}>
                                        <DropdownMenuSubTrigger disabled={!!reason} title={reason || undefined}>
                                            {Icon && <Icon className="size-4" />}
                                            {action.label}
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="min-w-48">
                                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                                {action.optionsTitle ?? action.label}
                                            </DropdownMenuLabel>
                                            {options.map((option) => (
                                                <DropdownMenuItem key={option.value} onSelect={() => start(action, option)}>
                                                    {option.icon && <option.icon className="size-4" />}
                                                    {option.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                )
                            }
                            return (
                                <React.Fragment key={action.id}>
                                    {isDestructive(action) && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                        disabled={!!reason}
                                        title={reason || undefined}
                                        variant={isDestructive(action) ? "destructive" : "default"}
                                        onSelect={() => start(action)}
                                    >
                                        {Icon && <Icon className="size-4" />}
                                        {action.label}
                                    </DropdownMenuItem>
                                </React.Fragment>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{pending?.confirm.title}</AlertDialogTitle>
                        {pending?.confirm.description && (
                            <AlertDialogDescription>{pending.confirm.description}</AlertDialogDescription>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant={pending?.confirm.destructive ? "destructive" : "default"}
                            onClick={() => {
                                if (pending) void run(pending.action, pending.option)
                                setPending(null)
                            }}
                        >
                            {pending?.confirm.confirmLabel ?? pending?.action.label}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

/** One action as a button; actions with options open a picker */
function BulkActionButton<TData>({
    action,
    rows,
    running,
    busy,
    onStart,
}: {
    action: DataTableBulkAction<TData>
    rows: TData[]
    running: boolean
    busy: boolean
    onStart: (action: DataTableBulkAction<TData>, option?: BulkActionOption) => void
}) {
    const [open, setOpen] = React.useState(false)
    const reason = disabledReason(action, rows)
    const options = resolveOptions(action, rows)
    const Icon = action.icon
    const iconOnly = !!action.iconOnly && !!Icon
    const variant = action.variant ?? "ghost"

    const button = (
        <Button
            size={iconOnly ? "icon" : "default"}
            variant={variant}
            disabled={!!reason || busy}
            aria-label={iconOnly ? action.label : undefined}
            title={iconOnly && !reason ? action.label : undefined}
            className={cn(
                !iconOnly && "gap-2",
                ACCENT_SURFACE[variant],
                isDestructive(action) && DESTRUCTIVE_TONE[variant],
                action.className
            )}
            onClick={options ? undefined : () => onStart(action)}
        >
            {running ? <Loader2 className="animate-spin" aria-hidden="true" /> : Icon && <Icon aria-hidden="true" />}
            {!iconOnly && action.label}
            {options && !iconOnly && <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />}
        </Button>
    )

    // A disabled button doesn't get hover events, so the reason goes on a wrapper
    const withReason = (child: React.ReactNode) =>
        reason ? (
            <span title={reason} className="inline-flex cursor-not-allowed">
                {child}
            </span>
        ) : (
            child
        )

    if (!options) return withReason(button)

    return withReason(
    <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{button}</PopoverTrigger>
            <PopoverContent align="start" collisionPadding={12} className="w-64 p-0">
                <Command>
                    {options.length >= SEARCH_OPTIONS_FROM && (
                        <CommandInput placeholder={`Search ${(action.optionsTitle ?? action.label).toLowerCase()}…`} />
                    )}
                    <CommandList className="max-h-72">
                        <CommandEmpty>No matches.</CommandEmpty>
                        <CommandGroup heading={action.optionsTitle ?? action.label}>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.description ?? ""}`}
                                    onSelect={() => {
                                        setOpen(false)
                                        onStart(action, option)
                                    }}
                                    className="cursor-pointer gap-2"
                                >
                                    {option.icon && <option.icon className="size-4 text-muted-foreground" />}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate">{option.label}</p>
                                        {option.description && (
                                            <p className="truncate text-xs text-muted-foreground">{option.description}</p>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

function resolveOptions<TData>(action: DataTableBulkAction<TData>, rows: TData[]): BulkActionOption[] | undefined {
    const options = typeof action.options === "function" ? action.options(rows) : action.options
    return options && options.length > 0 ? options : undefined
}

/** The reason an action is disabled for this selection, or "" when it's enabled */
function disabledReason<TData>(action: DataTableBulkAction<TData>, rows: TData[]): string {
    const result = action.disabled?.(rows)
    if (!result) return ""
    return typeof result === "string" ? result : "Not available for this selection"
}

/** A dangerous action: `destructive`, or the "destructive" look when that isn't set */
function isDestructive<TData>(action: DataTableBulkAction<TData>) {
    return action.destructive ?? action.variant === "destructive"
}

/** The confirmation to show, or undefined to run right away */
function resolveConfirm<TData>(
    action: DataTableBulkAction<TData>,
    rows: TData[],
    option: BulkActionOption | undefined,
    count: string
): BulkActionConfirm | undefined {
    const destructive = isDestructive(action)
    if (!action.confirm) return undefined
    const confirm =
        action.confirm === true
            ? {
                  title: option ? `${action.label} ${count}: ${option.label}?` : `${action.label} ${count}?`,
                  description: destructive ? "This can’t be undone." : undefined,
              }
            : typeof action.confirm === "function"
              ? action.confirm(rows, option)
              : action.confirm
    return { destructive, ...confirm }
}
