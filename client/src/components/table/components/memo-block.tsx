import * as React from "react"

/**
 * Renders its children again only when one of `deps` changes (compared with Object.is).
 * The table wraps its toolbar, header and pagination in these so ticking a checkbox doesn't
 * re-render them. List every value the children read; handlers must be stable
 * (useStableCallback or setState), or they'd be the ones from the last time deps changed.
 */
export const MemoBlock = React.memo(
    function MemoBlock({ children }: { deps: readonly unknown[]; children: React.ReactNode }) {
        return children
    },
    (prev, next) => prev.deps.length === next.deps.length && prev.deps.every((dep, index) => Object.is(dep, next.deps[index]))
)
