import * as React from "react";

import { format, startOfMonth, endOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { appIcons } from "@/configs/icons";

type DateRangeSelectorProps = {
    value?: DateRange;
    onChange?: (range: DateRange | undefined) => void;
};

export function DateSelector({
    value,
    onChange,
}: DateRangeSelectorProps) {

    const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(() => ({
        from: startOfMonth(new Date()),
        to: new Date(),
    }));

    const [open, setOpen] = React.useState(false);
    const [isCustomRange, setIsCustomRange] = React.useState(false);

    // Supports both controlled and standalone usage.
    const dateRange = value !== undefined ? value : internalRange;


    function handleSelect(range: DateRange | undefined) {
        setInternalRange(range);
        setIsCustomRange(true);
        onChange?.(range);
    }

    const label = isCustomRange && dateRange?.from && dateRange?.to
        ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
        : format(new Date(), "MMMM yyyy");


    function selectThisMonth() {
        const now = new Date();

        setInternalRange({
            from: startOfMonth(now),
            to: endOfMonth(now),
        });

        setIsCustomRange(false);

        onChange?.({
            from: startOfMonth(now),
            to: endOfMonth(now),
        });
    }


    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="secondary"
                    className="h-9 gap-2 font-medium text-xs"
                >
                    <appIcons.calendar className="size-4" />
                    <span className="hidden sm:inline">
                        {label}
                    </span>
                    <span className="sm:hidden">
                        {dateRange?.from && dateRange?.to
                            ? "Date range"
                            : "This month"}
                    </span>
                    <appIcons.chevronsUpDown className="size-4 opacity-60" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                className="w-auto p-3 gap-2 bg-layout"
            >
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium">
                            Date range
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Select a start and end date
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        size="icon-sm"
                        onClick={selectThisMonth}
                    >
                        <appIcons.refresh />
                    </Button>
                </div>

                <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleSelect}
                    numberOfMonths={1}
                    defaultMonth={dateRange?.from ?? new Date()}
                    disabled={[
                        { before: new Date(2025, 0, 1) },
                        { after: new Date() },
                    ]}
                    startMonth={new Date(2025, 0, 1)}
                    endMonth={new Date()}
                />


                <div className="flex items-center justify-between gap-3 border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                        {dateRange?.from && dateRange?.to
                            ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
                            : "Choose both dates"}
                    </p>

                    <Button
                        size="sm"
                        disabled={!dateRange?.from || !dateRange?.to}
                        onClick={() => setOpen(false)}
                    >
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
