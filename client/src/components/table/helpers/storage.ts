import { SETTINGS_STORAGE_VERSION, STORAGE_PREFIX, VIEWS_STORAGE_VERSION } from "../config/constants"
import type { SavedView, TableSettings } from "../types/views"

const settingsKey = (key: string) => `${STORAGE_PREFIX}:${key}`
const viewsKey = (key: string) => `${STORAGE_PREFIX}:${key}:views`

/* ---------------------------------------------------------------------- */
/* Layout preferences                                                      */
/* ---------------------------------------------------------------------- */

export function loadTableSettings(key: string): TableSettings | null {
    if (typeof window === "undefined") return null
    try {
        const raw = window.localStorage.getItem(settingsKey(key))
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (parsed?.v !== SETTINGS_STORAGE_VERSION) return null

        // Keep only well-formed values, in case the data was edited or corrupted
        return {
            order: Array.isArray(parsed.order) ? parsed.order.filter((id: unknown) => typeof id === "string") : undefined,
            visibility:
                parsed.visibility && typeof parsed.visibility === "object" ? parsed.visibility : undefined,
            sorting: Array.isArray(parsed.sorting)
                ? parsed.sorting.filter(
                    (s: unknown): s is { id: string; desc: boolean } =>
                        !!s && typeof (s as { id: unknown }).id === "string" && typeof (s as { desc: unknown }).desc === "boolean"
                )
                : undefined,
            pageSize: typeof parsed.pageSize === "number" ? parsed.pageSize : undefined,
            sizing:
                parsed.sizing && typeof parsed.sizing === "object"
                    ? Object.fromEntries(
                        Object.entries(parsed.sizing).filter(
                            ([, width]) => typeof width === "number" && Number.isFinite(width) && width > 0
                        )
                    ) as Record<string, number>
                    : undefined,
            activeViewId: typeof parsed.activeViewId === "string" ? parsed.activeViewId : null,
            headerIcons: typeof parsed.headerIcons === "boolean" ? parsed.headerIcons : undefined,
        }
    } catch {
        return null // unavailable (private mode) or invalid JSON
    }
}

export function saveTableSettings(key: string, settings: TableSettings) {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(settingsKey(key), JSON.stringify({ v: SETTINGS_STORAGE_VERSION, ...settings }))
    } catch {
        // Storage full or unavailable: the table still works, it just won't remember
    }
}

/* ---------------------------------------------------------------------- */
/* Saved views                                                             */
/* ---------------------------------------------------------------------- */

function isSavedView(value: unknown): value is SavedView {
    const v = value as Partial<SavedView> | null
    return (
        !!v &&
        typeof v.id === "string" &&
        typeof v.name === "string" &&
        typeof v.search === "string" &&
        Array.isArray(v.columnFilters) &&
        Array.isArray(v.sorting) &&
        Array.isArray(v.order) &&
        !!v.visibility &&
        typeof v.visibility === "object" &&
        !!v.sizing &&
        typeof v.sizing === "object"
    )
}

export function loadViews(key: string): SavedView[] {
    if (typeof window === "undefined") return []
    try {
        const parsed = JSON.parse(window.localStorage.getItem(viewsKey(key)) ?? "null")
        if (parsed?.v !== VIEWS_STORAGE_VERSION || !Array.isArray(parsed.views)) return []
        return parsed.views.filter(isSavedView)
    } catch {
        return []
    }
}

export function saveViews(key: string, views: SavedView[]) {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(viewsKey(key), JSON.stringify({ v: VIEWS_STORAGE_VERSION, views }))
    } catch {
        // Storage full or unavailable: views last for this session only
    }
}
