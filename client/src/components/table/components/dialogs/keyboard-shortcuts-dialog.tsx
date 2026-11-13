import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const SHORTCUT_GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
    {
        title: "Rows",
        items: [
            { keys: ["↓", "J"], label: "Next row" },
            { keys: ["↑", "K"], label: "Previous row" },
            { keys: ["Home"], label: "First row on page" },
            { keys: ["End"], label: "Last row on page" },
            { keys: ["Page Down"], label: "Next page" },
            { keys: ["Page Up"], label: "Previous page" },
        ],
    },
    {
        title: "Actions",
        items: [
            { keys: ["Space"], label: "Select row" },
            { keys: ["Shift", "↓ ↑"], label: "Select while moving" },
            { keys: ["Enter"], label: "Open details" },
        ],
    },
    {
        title: "Anywhere",
        items: [
            { keys: ["/"], label: "Search" },
            { keys: ["?"], label: "Show shortcuts" },
        ],
    },
]

export function KeyboardShortcutsDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Keyboard shortcuts</DialogTitle>
                    <DialogDescription>Press Tab to move into the table, then use these keys.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {SHORTCUT_GROUPS.map((group) => (
                        <section key={group.title} className="space-y-1.5">
                            <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {group.title}
                            </h3>
                            <dl className="space-y-1">
                                {group.items.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                                        <dt>{item.label}</dt>
                                        <dd className="flex gap-1">
                                            {item.keys.map((key) => (
                                                <kbd
                                                    key={key}
                                                    className="min-w-6 rounded border bg-muted px-1.5 py-0.5 text-center font-mono text-[11px] text-muted-foreground"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}