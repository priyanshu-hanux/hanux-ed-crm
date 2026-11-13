import * as React from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COPIED_FEEDBACK_MS } from "../../config/constants"
import { copyToClipboard } from "../../helpers/clipboard"

/**
 * Copies `text` and shows a tick for a moment. Icon-only by default;
 * pass `children` (e.g. "Copy all") for a small text button instead.
 */
export function CopyValueButton({
    text,
    label,
    children,
    className,
}: {
    text: string
    /** What is copied, for screen readers and the error toast, e.g. "email" or "skills" */
    label: string
    children?: React.ReactNode
    className?: string
}) {
    const [copied, setCopied] = React.useState(false)

    React.useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
        return () => clearTimeout(timer)
    }, [copied])

    return (
        <Button
            type="button"
            variant="ghost"
            size={children ? "xs" : "icon-xs"}
            aria-label={copied ? `${label} copied` : `Copy ${label}`}
            className={cn("shrink-0 text-muted-foreground hover:text-foreground", className)}
            onClick={async () => {
                try {
                    await copyToClipboard(text)
                    setCopied(true)
                } catch {
                    toast.error(`Couldn't copy ${label}.`)
                }
            }}
        >
            {copied ? <Check /> : <Copy />}
            {children && <span>{copied ? "Copied" : children}</span>}
        </Button>
    )
}
