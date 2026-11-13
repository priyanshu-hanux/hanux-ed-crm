import * as React from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { COPIED_FEEDBACK_MS } from "../../config/constants"
import { copyToClipboard } from "../../helpers/clipboard"

// A cell's content with a copy button that appears on row hover
export function CopyableCell({
    text,
    label,
    children,
}: {
    text: string
    label: string
    children: React.ReactNode
}) {
    const [copied, setCopied] = React.useState(false)

    React.useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
        return () => clearTimeout(timer)
    }, [copied])

    const handleCopy = async (event: React.MouseEvent) => {
        event.stopPropagation()
        try {
            await copyToClipboard(text)
            setCopied(true)
        } catch {
            toast.error(`Couldn't copy ${label}. Select the text and copy it manually.`)
        }
    }

    return (
        <div className="flex min-w-0 items-center gap-1">
            {/* truncate: any inline content (even a whitespace-nowrap span) ends in "…" instead of running under the button */}
            <div className="min-w-0 truncate">{children}</div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                aria-label={copied ? `${label} copied` : `Copy ${label}`}
                title={copied ? "Copied" : `Copy ${label}`}
                className={`h-6 w-6 shrink-0 text-muted-foreground transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${copied ? "opacity-100" : "opacity-0"
                    }`}
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <span className="sr-only" aria-live="polite">
                {copied ? `${label} copied` : ""}
            </span>
        </div>
    )
}
