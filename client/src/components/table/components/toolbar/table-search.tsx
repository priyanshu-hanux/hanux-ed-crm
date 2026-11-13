import type * as React from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"

/** Toolbar search box. Escape clears it; ↓ jumps into the results. */
export function TableSearch({
    inputRef,
    value,
    placeholder,
    onChange,
    onClear,
    onArrowDown,
    shortcut,
}: {
    inputRef: React.Ref<HTMLInputElement>
    value: string
    placeholder: string
    onChange: (value: string) => void
    onClear: () => void
    /** Return true when focus moved into the results (the key is then consumed) */
    onArrowDown?: () => boolean
    /** Key that focuses the box, shown at its end while empty, e.g. "/" */
    shortcut?: string
}) {
    return (
        <div className="relative min-w-40 flex-1 max-sm:order-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                ref={inputRef}
                type="search"
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") onClear()
                    if (event.key === "ArrowDown" && onArrowDown?.()) event.preventDefault()
                }}
                className="h-9 w-full pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
                aria-label={placeholder}
                aria-keyshortcuts={shortcut}
            />
            {value ? (
                <button
                    type="button"
                    onClick={onClear}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            ) : (
                shortcut && (
                    <kbd
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded border bg-muted/50 px-1 font-mono text-[11px] text-muted-foreground"
                    >
                        {shortcut}
                    </kbd>
                )
            )}
        </div>
    )
}
