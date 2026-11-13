import * as React from "react"

import { EDITABLE_SELECTOR } from "../config/constants"

/**
 * Page-wide shortcuts: "/" focuses the search, "?" opens the shortcut list.
 * Ignored while typing somewhere, or while a dialog or menu is open.
 */
export function useGlobalShortcuts({
    enabled,
    searchInputRef,
    setShortcutsOpen,
}: {
    enabled: boolean
    searchInputRef: React.RefObject<HTMLInputElement | null>
    setShortcutsOpen: (open: boolean) => void
}) {
    React.useEffect(() => {
        if (!enabled) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
            const target = event.target as HTMLElement | null
            if (target?.closest(EDITABLE_SELECTOR)) return
            if (document.querySelector("[role='dialog'][data-state='open'], [role='menu'][data-state='open']")) return

            if (event.key === "/" && searchInputRef.current) {
                event.preventDefault()
                searchInputRef.current.focus()
                searchInputRef.current.select()
            } else if (event.key === "?") {
                event.preventDefault()
                setShortcutsOpen(true)
            }
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [enabled, searchInputRef, setShortcutsOpen])
}
