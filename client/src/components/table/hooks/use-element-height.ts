import * as React from "react"

/** The element's height in px, kept current with a ResizeObserver. Stays 0 while disabled. */
export function useElementHeight(ref: React.RefObject<HTMLElement | null>, enabled = true) {
    const [height, setHeight] = React.useState(0)

    React.useLayoutEffect(() => {
        const el = ref.current
        if (!el || !enabled) return
        const measure = () => setHeight(el.offsetHeight)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [ref, enabled])

    return height
}
