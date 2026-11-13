import * as React from "react"

/**
 * Horizontal scroll sync between the header strip, the body and the proxy scrollbar under it.
 * Attach `syncFrom` as onScroll to all three.
 */
export function useSyncedScroll() {
    const headScrollRef = React.useRef<HTMLDivElement>(null)
    const bodyScrollRef = React.useRef<HTMLDivElement>(null)
    const scrollbarRef = React.useRef<HTMLDivElement>(null)
    /** Content of the proxy scrollbar, sized to the body's scroll width */
    const scrollbarInnerRef = React.useRef<HTMLDivElement>(null)

    // Moves every horizontal strip to x in the same frame. The 1px tolerance stops
    // strips with fractional widths from nudging each other back and forth.
    const scrollAllTo = React.useCallback((x: number, source?: HTMLElement) => {
        for (const el of [headScrollRef.current, bodyScrollRef.current, scrollbarRef.current]) {
            if (el && el !== source && Math.abs(el.scrollLeft - x) >= 1) el.scrollLeft = x
        }
    }, [])

    const syncFrom = React.useCallback(
        (event: React.UIEvent<HTMLElement>) => scrollAllTo(event.currentTarget.scrollLeft, event.currentTarget),
        [scrollAllTo]
    )

    // Native scrolling moves the body on the compositor thread and only then tells JS,
    // so a header synced in onScroll trails by a frame (the "jitter"). For wheel and
    // trackpad input we apply the offset to both tables ourselves, in the same frame.
    // onScroll above still covers scrollbar dragging and keyboard scrolling.
    React.useEffect(() => {
        const head = headScrollRef.current
        const body = bodyScrollRef.current
        if (!head || !body) return

        const onWheel = (event: WheelEvent) => {
            const horizontal = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX
            const vertical = event.shiftKey ? 0 : event.deltaY
            // Mostly vertical gesture: leave it alone so the page scrolls normally
            if (horizontal === 0 || Math.abs(horizontal) < Math.abs(vertical)) return

            const maxScroll = body.scrollWidth - body.clientWidth
            if (maxScroll <= 0) return

            event.preventDefault()
            const step = event.deltaMode === 1 ? horizontal * 16 : horizontal // line-based wheels (Firefox)
            const next = Math.max(0, Math.min(maxScroll, body.scrollLeft + step))
            scrollAllTo(next)
        }

        head.addEventListener("wheel", onWheel, { passive: false })
        body.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            head.removeEventListener("wheel", onWheel)
            body.removeEventListener("wheel", onWheel)
        }
    }, [scrollAllTo])

    return { headScrollRef, bodyScrollRef, scrollbarRef, scrollbarInnerRef, syncFrom }
}
