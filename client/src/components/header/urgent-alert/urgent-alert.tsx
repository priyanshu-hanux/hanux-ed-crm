import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { appIcons } from "@/configs/icons";
import { useState } from "react";

export function UrgentAlert() {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="relative"
                            aria-label="Alert Center"
                        >
                            <appIcons.alarm />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Alert Center</p>
                </TooltipContent>
            </Tooltip>

            <PopoverContent
                align="end"
                sideOffset={12}
                collisionPadding={12}
                className="w-[320px] rounded-xl border border-border/60 bg-layout p-0 shadow-xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                    <div>
                        <h3 className="text-sm font-medium">
                            Alert Center
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Your alerts and reminders
                        </p>
                    </div>

                    <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        All clear
                    </span>
                </div>

                {/* Empty state */}
                <div className="flex flex-col items-center px-6 py-8 text-center">
                    <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/40">
                        <appIcons.alarm className="size-6 text-muted-foreground" />

                        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-layout bg-emerald-500">
                            <svg
                                viewBox="0 0 12 12"
                                fill="none"
                                className="size-3 text-white"
                            >
                                <path
                                    d="m3 6 2 2 4-4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                    </div>

                    <h4 className="text-sm text-muted-foreground font-semibold tracking-tight">
                        You're all caught up
                    </h4>

                    <p className="mt-1.5 max-w-64 text-xs leading-5 text-muted-foreground">
                        Urgent calls, lead transfers, follow-ups, and task
                        reminders will show up here when they need your
                        attention.
                    </p>

                    <div className="mt-8 flex w-full items-center justify-center px-3">
                        <p className="text-neutral-300 text-2xl font-medium">
                            Stay focused
                        </p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
