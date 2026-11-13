import * as React from "react"
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"
import type { Column, RowData, Table } from "@tanstack/react-table"
import { Eye, EyeOff, GripVertical, Lock, RotateCcw, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { UTILITY_COLUMN_IDS } from "../../config/constants"
import { labelOf as columnLabel } from "../../helpers/columns"
import type { DataTableFeatures } from "../../types/column"
import { ColumnIcon } from "../cells/column-header-label"

type AnyColumn<TData extends RowData> = Column<DataTableFeatures, TData, unknown>

interface ColumnSettingsDialogProps<TData extends RowData> {
    table: Table<DataTableFeatures, TData>
    /** Ids of the movable (non-pinned) columns, in their current order */
    order: string[]
    onOrderChange: (order: string[]) => void
    /** Restores the default order and visibility */
    onReset: () => void
    /** True when order and visibility already match the default */
    isDefault: boolean
    /** Whether headers show column icons. Leave out to hide the setting (e.g. no column has an icon). */
    headerIcons?: boolean
    onHeaderIconsChange?: (on: boolean) => void
}

export function ColumnSettingsDialog<TData extends RowData>({
    table,
    order,
    onOrderChange,
    onReset,
    isDefault,
    headerIcons,
    onHeaderIconsChange,
}: ColumnSettingsDialogProps<TData>) {
    const [activeId, setActiveId] = React.useState<string | null>(null)

    const dataColumns = table
        .getAllLeafColumns()
        .filter((column) => !UTILITY_COLUMN_IDS.has(column.id))
    const byId = new Map(dataColumns.map((column) => [column.id, column]))

    const pinned = dataColumns.filter((c) => c.columnDef.meta?.sticky)
    const movable = order
        .map((id) => byId.get(id))
        .filter((column): column is NonNullable<typeof column> => !!column)

    const visibleCount = dataColumns.filter((c) => c.getIsVisible()).length
    const allVisible = visibleCount === dataColumns.length

    const sensors = useSensors(
        // Small distance so a click on the handle doesn't start a drag
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveId(null)
        if (!over || active.id === over.id) return
        const from = order.indexOf(String(active.id))
        const to = order.indexOf(String(over.id))
        if (from !== -1 && to !== -1) onOrderChange(arrayMove(order, from, to))
    }

    const labelOf = (id: string | number) => {
        const column = byId.get(String(id))
        return column ? columnLabel(column) : String(id)
    }
    const positionOf = (id: string | number) => order.indexOf(String(id)) + 1

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="shrink-0 gap-2 max-sm:px-2.5">
                    <SlidersHorizontal className="size-4" />
                    <span className="hidden sm:inline">Columns</span>
                </Button>
            </DialogTrigger>

            <DialogContent
                className="gap-0 overflow-hidden p-0 sm:max-w-sm"
                // Escape cancels a keyboard drag; don't let it also close the dialog
                onEscapeKeyDown={(event) => {
                    if (activeId) event.preventDefault()
                }}
            >
                {/* Header */}
                <div className="px-5 pb-4 pt-5 text-left border-b">
                    <div className="flex items-center gap-2 text-base">
                        <h3 className="font-medium">Customize columns</h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                            {visibleCount} / {dataColumns.length}
                        </span>
                    </div>
                    <p className="text-xs">
                        Drag to reorder. Hidden columns stay available here.
                    </p>
                </div>

                {/* Lists */}
                <div className="scroll-thin max-h-[min(440px,60vh)] space-y-4 overflow-y-auto px-5 py-5">
                    {pinned.length > 0 && (
                        <section>
                            <SectionLabel>Pinned</SectionLabel>
                            <div className="rounded-lg border bg-muted/30 p-1">
                                {pinned.map((column) => (
                                    <ColumnRow key={column.id} column={column} label={columnLabel(column)}>
                                        <span
                                            className="flex size-6 items-center justify-center text-muted-foreground/70"
                                            title="Pinned columns stay in place"
                                        >
                                            <Lock className="size-3.5" />
                                            <span className="sr-only">Pinned</span>
                                        </span>
                                    </ColumnRow>
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="flex items-center justify-between">
                            <SectionLabel>Columns</SectionLabel>
                            <button
                                type="button"
                                onClick={() => table.toggleAllColumnsVisible(true)}
                                disabled={allVisible}
                                className="-mt-1.5 rounded px-1 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                            >
                                Show all
                            </button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                            onDragStart={({ active }) => setActiveId(String(active.id))}
                            onDragCancel={() => setActiveId(null)}
                            onDragEnd={handleDragEnd}
                            accessibility={{
                                announcements: {
                                    onDragStart: ({ active }) => `Picked up ${labelOf(active.id)}.`,
                                    onDragOver: ({ active, over }) =>
                                        over
                                            ? `${labelOf(active.id)} moved to position ${positionOf(over.id)} of ${order.length}.`
                                            : undefined,
                                    onDragEnd: ({ active, over }) =>
                                        over
                                            ? `${labelOf(active.id)} dropped at position ${positionOf(over.id)}.`
                                            : `${labelOf(active.id)} dropped.`,
                                    onDragCancel: ({ active }) => `Moving ${labelOf(active.id)} cancelled.`,
                                },
                            }}
                        >
                            <SortableContext items={order} strategy={verticalListSortingStrategy}>
                                <ul className="rounded-lg border p-1">
                                    {movable.map((column) => (
                                        <SortableColumnRow
                                            key={column.id}
                                            column={column}
                                            label={columnLabel(column)}
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    </section>

                    {headerIcons !== undefined && onHeaderIconsChange && (
                        <section>
                            <SectionLabel>Display</SectionLabel>
                            <label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 text-sm hover:bg-muted/60">
                                <Checkbox
                                    checked={headerIcons}
                                    onCheckedChange={(checked) => onHeaderIconsChange(checked === true)}
                                />
                                <span className="flex-1">Show icons in headers</span>
                            </label>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        disabled={isDefault}
                        className="-ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <RotateCcw className="mr-1.5 size-3.5" />
                        Reset to default
                    </Button>
                    <DialogClose asChild>
                        <Button size="sm" className="px-4">
                            Done
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    )
}

/* ---------------------------------------------------------------------- */
/* Pieces                                                                  */
/* ---------------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    )
}

/** Shared row layout: leading slot (grip or lock), label, eye toggle */
function ColumnRow<TData extends RowData>({
    column,
    label,
    children,
    className,
    ...props
}: {
    column: AnyColumn<TData>
    label: string
    children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
    const visible = column.getIsVisible()
    const canHide = column.getCanHide()

    return (
        <div
            className={cn(
                "group flex h-9 items-center gap-1.5 rounded-md pl-1 pr-1 transition-colors hover:bg-muted/60",
                className
            )}
            {...props}
        >
            {children}
            <ColumnIcon column={column} className={visible ? undefined : "opacity-60"} />
            <span
                className={cn(
                    "min-w-0 flex-1 truncate text-sm transition-colors",
                    visible ? "text-foreground" : "text-muted-foreground/70"
                )}
            >
                {label}
            </span>
            <button
                type="button"
                onClick={() => column.toggleVisibility(!visible)}
                disabled={!canHide}
                aria-pressed={visible}
                aria-label={visible ? `Hide ${label}` : `Show ${label}`}
                title={visible ? "Hide column" : "Show column"}
                className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
                    visible ? "text-foreground" : "text-muted-foreground/60"
                )}
            >
                {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
        </div>
    )
}

function SortableColumnRow<TData extends RowData>({
    column,
    label,
}: {
    column: AnyColumn<TData>
    label: string
}) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id: column.id })

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={cn("relative", isDragging && "z-10")}
        >
            <ColumnRow
                column={column}
                label={label}
                className={cn(isDragging && "bg-background shadow-lg ring-1 ring-border hover:bg-background")}
            >
                {/* Only the handle starts a drag, so the eye button is just a click */}
                <button
                    ref={setActivatorNodeRef}
                    type="button"
                    aria-label={`Reorder ${label}`}
                    className={cn(
                        "flex size-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground transition-opacity active:cursor-grabbing",
                        "opacity-40 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:none)]:opacity-100",
                        isDragging && "opacity-100"
                    )}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-4" />
                </button>
            </ColumnRow>
        </li>
    )
}