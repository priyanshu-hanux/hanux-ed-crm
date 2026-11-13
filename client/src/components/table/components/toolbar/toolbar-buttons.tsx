import { RefreshCw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RefreshButton({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
            className="shrink-0"
        >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
        </Button>
    )
}

export function BulkDeleteButton({ count, onDelete }: { count: number; onDelete: () => void }) {
    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="ml-2"
        >
            <Trash2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden">Del</span> ({count})
        </Button>
    )
}
