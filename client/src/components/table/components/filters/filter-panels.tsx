import * as React from "react"
import { Check, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SELECT_FILTER_SEARCH_THRESHOLD } from "../../config/constants"
import { labelOf } from "../../helpers/columns"
import { toNumber } from "../../helpers/filter-fns"
import { optionKey } from "../../helpers/filter-fns"
import { filterConfigOf, getNumericBounds, getSelectOptions, summarize } from "../../helpers/filter-summary"
import type { AnyDataTableColumn, RangeFilterConfig, SelectFilterConfig } from "../../types/column"
import type { RangeFilterValue, SelectFilterValue } from "../../types/filters"

/* ---------------------------------------------------------------------- */
/* Detail panels                                                           */
/* ---------------------------------------------------------------------- */

export function FilterPanel({ column, onBack }: { column: AnyDataTableColumn; onBack: () => void }) {
    const config = filterConfigOf(column)
    const hasValue = summarize(column) !== null

    // Commit the draft (undefined removes the filter), then return to the list
    const apply = (value: unknown) => {
        column.setFilterValue(value)
        onBack()
    }

    return (
        <div>
            <div className="flex items-center gap-2 border-b px-3 py-2.5">
                <Button variant="outline" size="icon" className="size-7" onClick={onBack} aria-label="Back to filters">
                    <ChevronLeft className="size-4" />
                </Button>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{labelOf(column)}</p>
                {hasValue && (
                    <button
                        type="button"
                        onClick={() => apply(undefined)}
                        className="rounded text-xs font-medium text-primary hover:underline"
                    >
                        Clear
                    </button>
                )}
            </div>

            {config.type === "text" && (
                <TextPanel
                    initial={(column.getFilterValue() as string | undefined) ?? ""}
                    placeholder={config.placeholder}
                    onApply={apply}
                />
            )}
            {config.type === "select" && <SelectPanel column={column} config={config} onApply={apply} />}
            {config.type === "range" && <RangePanel column={column} config={config} onApply={apply} />}
        </div>
    )
}

function TextPanel({
    initial,
    placeholder,
    onApply,
}: {
    initial: string
    placeholder?: string
    onApply: (value: unknown) => void
}) {
    const [draft, setDraft] = React.useState(initial)

    return (
        <form
            className="space-y-3 p-3"
            onSubmit={(event) => {
                event.preventDefault()
                onApply(draft.trim() || undefined)
            }}
        >
            <label className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">Contains</span>
                <Input
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={placeholder ?? "Type a value"}
                    className="h-9"
                />
            </label>
            <Button type="submit" className="w-full">
                Apply
            </Button>
        </form>
    )
}

function SelectPanel({
    column,
    config,
    onApply,
}: {
    column: AnyDataTableColumn
    config: SelectFilterConfig
    onApply: (value: unknown) => void
}) {
    const multiple = !!config.multiple
    const options = getSelectOptions(column, config)
    const [draft, setDraft] = React.useState<string[]>(
        (column.getFilterValue() as SelectFilterValue | undefined) ?? []
    )
    const commandRef = React.useRef<HTMLDivElement>(null)
    const showSearch = options.length > SELECT_FILTER_SEARCH_THRESHOLD

    // Without a search box, focus the list itself so the arrow keys work right away
    React.useEffect(() => {
        if (!showSearch) commandRef.current?.focus()
    }, [showSearch])

    // Compared ignoring capitals, like the options themselves ("infosys" from an old link ticks "Infosys")
    const isPicked = (list: string[], value: string) => list.some((v) => optionKey(v) === optionKey(value))
    const toggle = (value: string) =>
        setDraft((prev) => {
            const picked = isPicked(prev, value)
            if (!multiple) return picked ? [] : [value]
            return picked ? prev.filter((v) => optionKey(v) !== optionKey(value)) : [...prev, value]
        })

    return (
        <div className="space-y-3 p-3">
            <p className="text-xs text-muted-foreground">{multiple ? "Is any of" : "Is"}</p>

            <Command ref={commandRef} tabIndex={-1} loop className="rounded-md border outline-none">
                {showSearch && <CommandInput autoFocus placeholder="Search…" />}
                <CommandList className="scroll-thin max-h-56">
                    <CommandEmpty>No matches.</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => {
                            const selected = isPicked(draft, option.value)
                            return (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    keywords={[option.label ?? option.value]}
                                    onSelect={() => toggle(option.value)}
                                    className="cursor-pointer gap-2"
                                >
                                    {multiple ? (
                                        <Checkbox checked={selected} tabIndex={-1} aria-hidden className="pointer-events-none" />
                                    ) : (
                                        <Check className={cn("size-4", selected ? "opacity-100" : "opacity-0")} />
                                    )}
                                    {option.icon && <option.icon className="size-4 text-muted-foreground" />}
                                    <span className="min-w-0 flex-1 truncate">{option.label ?? option.value}</span>
                                    {option.count != null && (
                                        <span className="text-xs tabular-nums text-muted-foreground">{option.count}</span>
                                    )}
                                </CommandItem>
                            )
                        })}
                    </CommandGroup>
                </CommandList>
            </Command>

            <Button className="w-full" onClick={() => onApply(draft.length ? draft : undefined)}>
                Apply{multiple && draft.length > 0 ? ` (${draft.length})` : ""}
            </Button>
        </div>
    )
}

function RangePanel({
    column,
    config,
    onApply,
}: {
    column: AnyDataTableColumn
    config: RangeFilterConfig
    onApply: (value: unknown) => void
}) {
    const [initialMin, initialMax] = (column.getFilterValue() as RangeFilterValue | undefined) ?? []
    const [min, setMin] = React.useState(initialMin?.toString() ?? "")
    const [max, setMax] = React.useState(initialMax?.toString() ?? "")

    // Smallest and largest number in the data (values like "5 years" count as 5)
    const bounds = React.useMemo(() => getNumericBounds(column), [column])

    const unit = config.unit ? ` ${config.unit}` : ""

    return (
        <form
            className="space-y-3 p-3"
            onSubmit={(event) => {
                event.preventDefault()
                let low = toNumber(min)
                let high = toNumber(max)
                if (low !== undefined && high !== undefined && low > high) [low, high] = [high, low]
                onApply(low === undefined && high === undefined ? undefined : [low, high])
            }}
        >
            <p className="text-xs text-muted-foreground">Between</p>
            <div className="flex items-center gap-2">
                <Input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    min={config.min}
                    max={config.max}
                    step={config.step ?? 1}
                    value={min}
                    onChange={(event) => setMin(event.target.value)}
                    placeholder={bounds ? `Min ${bounds.low}` : "Min"}
                    aria-label="Minimum"
                    className="h-9"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                    type="number"
                    inputMode="decimal"
                    min={config.min}
                    max={config.max}
                    step={config.step ?? 1}
                    value={max}
                    onChange={(event) => setMax(event.target.value)}
                    placeholder={bounds ? `Max ${bounds.high}` : "Max"}
                    aria-label="Maximum"
                    className="h-9"
                />
            </div>
            {bounds && (
                <p className="text-[11px] text-muted-foreground">
                    Values in data: {bounds.low}–{bounds.high}
                    {unit}. Leave a side empty for no limit.
                </p>
            )}
            <Button type="submit" className="w-full">
                Apply
            </Button>
        </form>
    )
}
