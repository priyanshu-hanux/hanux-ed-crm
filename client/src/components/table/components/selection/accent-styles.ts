import type { BulkActionVariant } from "../../types/bulk-actions"

/*
 * Button styles for the selection toolbar. The toolbar is tinted with --dt-accent (see
 * styles/data-table.css), so the Button variants are re-tinted to sit on it instead of on the page.
 * Recolour everything by overriding --dt-accent; tweak one action with its className.
 */

// Every look, tinted for the selection toolbar's accent surface (--dt-accent) instead of the plain page
const FOCUS = "focus-visible:border-(--dt-accent)/50 focus-visible:ring-(--dt-accent)/25"
export const ACCENT_SURFACE: Record<BulkActionVariant, string> = {
    ghost: `text-foreground/80 hover:bg-(--dt-accent)/10 hover:text-foreground aria-expanded:bg-(--dt-accent)/10 aria-expanded:text-foreground dark:hover:bg-(--dt-accent)/15 ${FOCUS}`,
    outline: `border-(--dt-accent)/20 bg-background/80 hover:border-(--dt-accent)/40 hover:bg-background aria-expanded:border-(--dt-accent)/40 aria-expanded:bg-background dark:border-(--dt-accent)/25 dark:bg-(--dt-accent)/5 dark:hover:bg-(--dt-accent)/10 dark:aria-expanded:bg-(--dt-accent)/10 ${FOCUS}`,
    secondary: `bg-(--dt-accent)/10 text-foreground hover:bg-(--dt-accent)/15 aria-expanded:bg-(--dt-accent)/15 aria-expanded:text-foreground dark:bg-(--dt-accent)/15 dark:hover:bg-(--dt-accent)/20 ${FOCUS}`,
    default: `bg-(--dt-accent) text-(--dt-accent-foreground) hover:bg-(--dt-accent)/90 aria-expanded:bg-(--dt-accent)/90 ${FOCUS}`,
    destructive: "",
}

// A dangerous action on each look: red text, red-tinted border and hover ("destructive" is already red)
export const DESTRUCTIVE_TONE: Record<BulkActionVariant, string> = {
    ghost: "text-destructive hover:bg-destructive/10 hover:text-destructive aria-expanded:bg-destructive/10 aria-expanded:text-destructive",
    outline:
        "border-destructive/25 text-destructive hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive dark:border-destructive/30 dark:bg-destructive/5 dark:hover:bg-destructive/10",
    secondary: "bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive dark:bg-destructive/15 dark:hover:bg-destructive/20",
    destructive: "",
    default: "bg-destructive text-white hover:bg-destructive/90 aria-expanded:bg-destructive/90",
}
