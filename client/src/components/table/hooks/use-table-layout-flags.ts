import * as React from "react"

/**
 * Visual state written straight to the wrapper's DOM, so scrolling never re-renders React:
 *   data-stuck           header is currently pinned
 *   data-overflow-left   columns are hidden off the left edge
 *   data-overflow-right  columns are hidden off the right edge
 *   --dt-gutter          width of the body's vertical scrollbar
 *   --dt-body-width      visible width of the body
 *   --dt-head-height     height of the header strip
 * Also sizes the proxy scrollbar's content to the body's scroll width.
 */
export function useTableLayoutFlags({
    wrapperRef,
    headRef,
    bodyRef,
    scrollbarInnerRef,
    stickyHeader,
    visibleColumnsKey,
    maxBodyHeight,
}: {
    wrapperRef: React.RefObject<HTMLDivElement | null>
    headRef: React.RefObject<HTMLDivElement | null>
    bodyRef: React.RefObject<HTMLDivElement | null>
    scrollbarInnerRef: React.RefObject<HTMLDivElement | null>
    stickyHeader: boolean
    visibleColumnsKey: string
    maxBodyHeight?: number | string
}) {
    React.useEffect(() => {
        const wrapper = wrapperRef.current
        const head = headRef.current
        const body = bodyRef.current
        if (!wrapper || !head || !body) return

        /* --- Cheap, runs on scroll: only reads positions, never writes styles --- */
        let frame = 0
        const updateFlags = () => {
            frame = 0
            const stuck =
                stickyHeader &&
                head.getBoundingClientRect().top - wrapper.getBoundingClientRect().top > 0.5
            wrapper.toggleAttribute("data-stuck", stuck)

            const maxScroll = body.scrollWidth - body.clientWidth
            wrapper.toggleAttribute("data-overflow-left", body.scrollLeft > 1)
            wrapper.toggleAttribute("data-overflow-right", body.scrollLeft < maxScroll - 1)
        }
        const scheduleFlags = () => {
            if (!frame) frame = requestAnimationFrame(updateFlags)
        }

        /* --- Runs only when sizes change: body's vertical scrollbar width --- */
        let lastGutter = ""
        const updateGutter = () => {
            const bodyStyle = getComputedStyle(body)
            const scrollbar = Math.max(0, body.offsetWidth - body.clientWidth
                - parseFloat(bodyStyle.borderLeftWidth)
                - parseFloat(bodyStyle.borderRightWidth))
            const gutter = `${scrollbar}px`
            if (gutter !== lastGutter) {
                lastGutter = gutter
                wrapper.style.setProperty("--dt-gutter", gutter)
            }

            wrapper.style.setProperty("--dt-body-width", `${body.clientWidth}px`)
            wrapper.style.setProperty("--dt-head-height", `${head.offsetHeight}px`)

            // The proxy is wider than the body's visible area by the gutter, so its content
            // gets the same extra width; that gives both the same maximum scroll
            const inner = scrollbarInnerRef.current
            if (inner) {
                const width = `${body.scrollWidth + scrollbar}px`
                if (inner.style.width !== width) inner.style.width = width
            }
        }
        const onResize = () => {
            updateGutter()
            scheduleFlags()
        }

        updateGutter()
        updateFlags()
        document.addEventListener("scroll", scheduleFlags, { capture: true, passive: true })
        window.addEventListener("resize", onResize)
        const observer = new ResizeObserver(onResize)
        observer.observe(body)
        observer.observe(wrapper)
        // The table's width changes on its own when columns are shown or hidden
        const bodyTable = body.querySelector("table")
        if (bodyTable) observer.observe(bodyTable)

        return () => {
            document.removeEventListener("scroll", scheduleFlags, { capture: true })
            window.removeEventListener("resize", onResize)
            observer.disconnect()
            cancelAnimationFrame(frame)
        }
    }, [wrapperRef, headRef, bodyRef, scrollbarInnerRef, stickyHeader, visibleColumnsKey, maxBodyHeight])
}
