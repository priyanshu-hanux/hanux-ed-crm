import type { CopyableConfig } from "../types/column"

/** Copies text, with a fallback for non-HTTPS origins (e.g. testing on a LAN IP). Throws when copying fails. */
export async function copyToClipboard(text: string) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return
    }
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand("copy")
    textarea.remove()
    if (!ok) throw new Error("Copy failed")
}

/** Works out what to copy for a cell (the first value of an array), or null when there's nothing worth copying. */
export function resolveCopyText(
    copyable: boolean | CopyableConfig | undefined,
    value: unknown,
    row: unknown
): string | null {
    if (!copyable) return null
    let raw = typeof copyable === "object" && copyable.getText ? copyable.getText(row) : value
    // Multi-value cells (e.g. several emails) copy the first, primary value
    if (Array.isArray(raw)) raw = raw.find((item) => (typeof item === "string" || typeof item === "number") && String(item).trim() !== "")
    if (typeof raw !== "string" && typeof raw !== "number") return null
    const text = String(raw).trim()
    return text === "" || text === "N/A" ? null : text
}

/** Name used in a copy button's label: meta.copyable.label, the column's displayName, or "value" */
export function resolveCopyLabel(meta: { copyable?: boolean | CopyableConfig; displayName?: string } | undefined) {
    return (
        (typeof meta?.copyable === "object" && meta.copyable.label) ||
        meta?.displayName?.toLowerCase() ||
        "value"
    )
}
