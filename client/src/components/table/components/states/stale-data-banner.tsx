import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

// A refresh failed, but older rows are still shown
export function StaleDataBanner({ onRetry, isRetrying }: { onRetry?: () => void; isRetrying?: boolean }) {
    return (
        <div
            role="alert"
            className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
        >
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <span className="min-w-0 flex-1">
                <span className="font-medium text-destructive">Couldn’t refresh.</span>{" "}
                <span className="text-muted-foreground">Showing the last loaded data.</span>
            </span>
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying} className="shrink-0">
                    {isRetrying ? "Retrying…" : "Retry"}
                </Button>
            )}
        </div>
    )
}
