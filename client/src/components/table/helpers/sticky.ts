/** True when two id → offset maps hold the same offsets */
export function sameOffsets(a: Record<string, number>, b: Record<string, number>) {
    const keys = Object.keys(a)
    return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
}
