import * as React from "react"

// A function that keeps the same identity across renders but always runs the latest `fn`.
// Lets a memoized part of the table hold on to a handler without it going stale.
export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
    const latest = React.useRef(fn)
    React.useLayoutEffect(() => {
        latest.current = fn
    })
    return React.useCallback((...args: A) => latest.current(...args), [])
}
