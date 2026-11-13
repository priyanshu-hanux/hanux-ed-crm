import * as React from "react"
import { Bookmark, Check, ChevronDown, Pencil, Plus, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { SavedView } from "../../types/views"

interface DataTableViewsProps {
    views: SavedView[]
    activeViewId: string | null
    /** Name of the built-in view without filters, e.g. "All candidates" */
    defaultViewName: string
    /** The current setup differs from the active view */
    isModified: boolean
    onSelect: (viewId: string | null) => void
    onSaveNew: (name: string) => void
    onUpdate: () => void
    onRename: (name: string) => void
    onDelete: () => void
}

export function DataTableViews({
    views,
    activeViewId,
    defaultViewName,
    isModified,
    onSelect,
    onSaveNew,
    onUpdate,
    onRename,
    onDelete,
}: DataTableViewsProps) {
    const [dialog, setDialog] = React.useState<"create" | "rename" | null>(null)
    const activeView = views.find((view) => view.id === activeViewId)
    const label = activeView?.name ?? defaultViewName

    // Names already in use (when renaming, the view's own name doesn't count)
    const takenNames = React.useMemo(
        () =>
            new Set(
                views
                    .filter((view) => !(dialog === "rename" && view.id === activeViewId))
                    .map((view) => view.name.trim().toLowerCase())
            ),
        [views, dialog, activeViewId]
    )

    return (
        <>
            {/* modal={false}: opening a dialog from a menu item otherwise leaves the page unclickable */}
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="max-w-56 min-w-0 gap-2 font-semibold max-sm:px-2.5">
                        {/* The "edited" dot sits on the icon's corner, so it never changes the button's width */}
                        <span className="relative shrink-0">
                            <Bookmark className="size-4" />
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-card transition-[opacity,scale] duration-200 ease-(--ease-smooth)",
                                    isModified ? "scale-100 opacity-100" : "scale-0 opacity-0"
                                )}
                            />
                        </span>
                        <span className="truncate">{label}</span>
                        {isModified && <span className="sr-only">(edited)</span>}
                        <ChevronDown className="size-3.5 shrink-0 opacity-60" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Views</DropdownMenuLabel>

                    <DropdownMenuItem onSelect={() => onSelect(null)}>
                        <Check className={cn("size-4", activeViewId === null ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{defaultViewName}</span>
                    </DropdownMenuItem>
                    {views.map((view) => (
                        <DropdownMenuItem key={view.id} onSelect={() => onSelect(view.id)}>
                            <Check className={cn("size-4", view.id === activeViewId ? "opacity-100" : "opacity-0")} />
                            <span className="truncate">{view.name}</span>
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />

                    {activeView && isModified && (
                        <DropdownMenuItem onSelect={onUpdate}>
                            <Save className="size-4" />
                            <span className="truncate">Save changes to “{activeView.name}”</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={() => setDialog("create")}>
                        <Plus className="size-4" />
                        Save as new view…
                    </DropdownMenuItem>
                    {activeView && (
                        <>
                            <DropdownMenuItem onSelect={() => setDialog("rename")}>
                                <Pencil className="size-4" />
                                Rename view…
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="size-4" />
                                Delete view
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <ViewNameDialog
                open={dialog !== null}
                mode={dialog ?? "create"}
                initialName={dialog === "rename" ? activeView?.name ?? "" : ""}
                takenNames={takenNames}
                onOpenChange={(open) => {
                    if (!open) setDialog(null)
                }}
                onSubmit={(name) => {
                    if (dialog === "rename") onRename(name)
                    else onSaveNew(name)
                    setDialog(null)
                }}
            />
        </>
    )
}

function ViewNameDialog({
    open,
    mode,
    initialName,
    takenNames,
    onOpenChange,
    onSubmit,
}: {
    open: boolean
    mode: "create" | "rename"
    initialName: string
    takenNames: Set<string>
    onOpenChange: (open: boolean) => void
    onSubmit: (name: string) => void
}) {
    const [name, setName] = React.useState(initialName)

    // Start fresh each time the dialog opens
    React.useEffect(() => {
        if (open) setName(initialName)
    }, [open, initialName])

    const trimmed = name.trim()
    const error = trimmed && takenNames.has(trimmed.toLowerCase()) ? "A view with this name already exists." : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                        if (trimmed && !error) onSubmit(trimmed)
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{mode === "rename" ? "Rename view" : "Save view"}</DialogTitle>
                        <DialogDescription>
                            {mode === "rename"
                                ? "Give this view a new name."
                                : "Saves the current search, filters, sorting and columns."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Input
                            autoFocus
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={60}
                            placeholder="e.g. Senior engineers in Bengaluru"
                            aria-label="View name"
                            aria-invalid={!!error}
                            aria-describedby={error ? "view-name-error" : undefined}
                        />
                        {error && (
                            <p id="view-name-error" className="text-xs text-destructive">
                                {error}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!trimmed || !!error}>
                            {mode === "rename" ? "Rename" : "Save view"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}