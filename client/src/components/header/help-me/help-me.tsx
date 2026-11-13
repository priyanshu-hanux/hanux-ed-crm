
import * as React from "react";
import {
    BookOpen,
    Bug,
    ChevronRight,
    Command,
    ExternalLink,
    Lightbulb,
    LifeBuoy,
    MessageSquare,
    Search,
    Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { appIcons } from "@/configs/icons";

type HelpMeProps = {
    onFeedback?: () => void;
    onReportBug?: () => void;
    onContactSupport?: () => void;
    onRequestFeature?: () => void;
    onOpenGuide?: (guide: HelpGuide) => void;
};

type HelpGuide = {
    title: string;
    description: string;
    category: string;
};

const helpGuides: HelpGuide[] = [
    {
        title: "Managing leads",
        description: "Lead profiles, filters and bulk actions",
        category: "Lead Management",
    },
    {
        title: "Importing your data",
        description: "CSV uploads, duplicate checks and imports",
        category: "Lead Management",
    },
    {
        title: "Understanding call logs",
        description: "Review calls, outcomes and missed calls",
        category: "Activities",
    },
    {
        title: "Using AI Search",
        description: "Search CRM records and explore insights",
        category: "AI & Search",
    },
    {
        title: "Managing targets",
        description: "Track progress and sales performance",
        category: "Reports & Targets",
    },
];

const quickActions = [
    {
        label: "Send feedback",
        description: "Share an idea or suggestion",
        icon: MessageSquare,
        action: "feedback" as const,
    },
    {
        label: "Report a bug",
        description: "Tell us when something goes wrong",
        icon: Bug,
        action: "bug" as const,
    },
    {
        label: "Request a feature",
        description: "Suggest an improvement",
        icon: Lightbulb,
        action: "feature" as const,
    },
    {
        label: "Contact support",
        description: "Get help with your account",
        icon: LifeBuoy,
        action: "support" as const,
    },
];

export function HelpMe({
    onFeedback,
    onReportBug,
    onContactSupport,
    onRequestFeature,
    onOpenGuide,
}: HelpMeProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");

    const filteredGuides = React.useMemo(() => {
        const normalized = query.trim().toLowerCase();

        if (!normalized) return helpGuides;

        return helpGuides.filter((guide) =>
            [
                guide.title,
                guide.description,
                guide.category,
            ].some((value) => value.toLowerCase().includes(normalized)),
        );
    }, [query]);

    const handleAction = (action: (typeof quickActions)[number]["action"]) => {
        const handlers = {
            feedback: onFeedback,
            bug: onReportBug,
            feature: onRequestFeature,
            support: onContactSupport,
        };

        const handler = handlers[action];

        if (handler) {
            setOpen(false);
            handler();
        }
    };

    return (
        <Popover
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) setQuery("");
            }}
        >

            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            aria-label="Open Help Center"
                            aria-expanded={open}
                        >
                            <appIcons.help />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Help Center</p>
                </TooltipContent>
            </Tooltip>

            <PopoverContent
                align="end"
                side="bottom"
                sideOffset={12}
                collisionPadding={12}
                className="w-[min(380px,calc(100vw-24px))] max-h-[min(560px,calc(100dvh-100px))] overflow-hidden rounded-xl border border-border/60 bg-layout p-0 gap-0 shadow-xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-4 py-4 border-b border-border/50">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted/80 text-primary">
                            <appIcons.help className="size-6 text-muted-foreground" />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold tracking-tight">
                                Help Center
                            </h3>
                            <p className="text-xs leading-5 text-muted-foreground">
                                Find answers or get help from our team.
                            </p>
                        </div>
                    </div>

                    <Badge
                        variant="secondary"
                        className="gap-1 rounded-full px-2 py-1 text-[10px] font-medium"
                    >
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Support
                    </Badge>
                </div>

                <div className="scrollbar-thin scrollbar overflow-x-hidden overflow-y-auto">
                    {/* Quick actions */}
                    <div className="px-4 py-4 border-b border-border/50">
                        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Quick actions
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.action}
                                        type="button"
                                        onClick={() =>
                                            handleAction(item.action)
                                        }
                                        disabled={
                                            !({
                                                feedback: onFeedback,
                                                bug: onReportBug,
                                                feature: onRequestFeature,
                                                support: onContactSupport,
                                            }[item.action])
                                        }
                                        className="group flex min-w-0 items-start gap-2.5 rounded-xl border border-border/60 p-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="min-w-0 pt-0.5">
                                            <span className="block text-xs font-medium">
                                                {item.label}
                                            </span>
                                            <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">
                                                {item.description}
                                            </span>
                                        </span>

                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                            <Icon className="size-4" />
                                        </span>

                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-4 py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Search help articles..."
                                aria-label="Search help articles"
                                className="h-10 rounded-xl border-border/70 bg-muted/30 pl-9 pr-12 text-sm shadow-none focus-visible:bg-background"
                            />

                            {!query && (
                                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    <Command className="inline size-3" /> K
                                </kbd>
                            )}
                        </div>
                    </div>


                    {/* Help resources */}
                    <div className="px-4 pb-2">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {query ? "Search results" : "Popular resources"}
                            </p>

                            <BookOpen className="size-4 text-muted-foreground" />
                        </div>

                        <div>
                            {filteredGuides.length > 0 ? (
                                filteredGuides.map((guide) => (
                                    <button
                                        key={guide.title}
                                        type="button"
                                        onClick={() => {
                                            onOpenGuide?.(guide);
                                            if (onOpenGuide) setOpen(false);
                                        }}
                                        disabled={!onOpenGuide}
                                        className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:cursor-default"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
                                            <BookOpen className="size-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium">
                                                {guide.title}
                                            </p>
                                            <p className="mt-1 truncate text-[11px] text-muted-foreground">
                                                {guide.description}
                                            </p>
                                        </div>

                                        <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                                    </button>
                                ))
                            ) : (
                                <div className="flex flex-col items-center py-6 text-center">
                                    <Search className="mb-2 size-5 text-muted-foreground" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        No articles found
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Try another keyword or contact support.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <Separator />

                    <div className="flex items-center justify-between gap-3 bg-muted/20 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-muted-foreground" />
                            <p className="text-[11px] text-muted-foreground">
                                Need more help?
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg px-2 text-xs"
                            disabled={!onContactSupport}
                            onClick={() => handleAction("support")}
                        >
                            Contact us
                            <ExternalLink className="size-3" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
