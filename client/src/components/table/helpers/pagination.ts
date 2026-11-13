export type PageItem = number | "ellipsis-start" | "ellipsis-end"

/**
 * Page numbers to show, e.g. [1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 12].
 * Always shows the first and last page, plus `siblings` pages on each side of the current one.
 * Keeps the count constant, so the bar doesn't change width as you page through.
 */
export function getPageItems(current: number, total: number, siblings = 1): PageItem[] {
    const range = (from: number, to: number) =>
        Array.from({ length: to - from + 1 }, (_, i) => from + i)

    // first + last + current + siblings on both sides + two ellipses
    const maxItems = siblings * 2 + 5
    if (total <= maxItems) return range(1, total)

    const left = Math.max(current - siblings, 1)
    const right = Math.min(current + siblings, total)
    const showStartEllipsis = left > 3
    const showEndEllipsis = right < total - 2
    const edgeCount = 3 + siblings * 2 // numbers shown on the side without an ellipsis

    if (!showStartEllipsis) return [...range(1, edgeCount), "ellipsis-end", total]
    if (!showEndEllipsis) return [1, "ellipsis-start", ...range(total - edgeCount + 1, total)]
    return [1, "ellipsis-start", ...range(left, right), "ellipsis-end", total]
}

/** 1-based page that holds the row at `index` (0-based) */
export function pageOfIndex(index: number, pageSize: number) {
    return Math.floor(index / pageSize) + 1
}
