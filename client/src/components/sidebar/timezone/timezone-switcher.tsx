import { useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Clock3 } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { CountryFlag } from "./country-flag";
import { StatusDot } from "./status-dot";
import {
  describeCallingHours,
  describeRelativeToLocal,
  formatTime,
  getCallWindowStatus,
  getZoneAbbreviation,
  type CallWindowStatus,
} from "./time-utils";
import { TIMEZONES, type TimezoneOption } from "./timezones";
import { useNow } from "./use-now";
import { useWorkingTimezone } from "./use-working-timezone";

interface Row {
  tz: TimezoneOption;
  time: string;
  abbr: string;
  status: CallWindowStatus;
}

export function TimezoneSwitcher() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const now = useNow();
  const { timezone, select } = useWorkingTimezone();
  const [open, setOpen] = useState(false);
  const pickedWithPointer = useRef(false);

  // Recomputed once a minute (when `now` ticks), not on every render.
  const rows = useMemo<Row[]>(
    () =>
      now
        ? TIMEZONES.map((tz) => ({
          tz,
          time: formatTime(tz.timeZone, now),
          abbr: getZoneAbbreviation(tz.timeZone, now),
          status: getCallWindowStatus(tz.timeZone, now),
        }))
        : [],
    [now]
  );

  const current = rows.find((row) => row.tz.id === timezone.id);
  const callable = rows.filter((row) => row.status.good);
  const outside = rows.filter((row) => !row.status.good);

  const tooltip = current
    ? `${timezone.city}, ${current.time} ${current.abbr}: ${current.status.label}`
    : "Working timezone";

  const handleSelect = (id: string) => {
    select(id);
    setOpen(false);
  };

  const renderRow = ({ tz, time, abbr, status }: Row) => {
    const selected = tz.id === timezone.id;
    return (
      <CommandItem
        key={tz.id}
        value={tz.id}
        keywords={[tz.city, tz.country, tz.countryCode, tz.timeZone, abbr]}
        data-checked={selected ? "true" : undefined}
        onSelect={() => handleSelect(tz.id)}
        className="gap-2.5 py-2 cursor-pointer"
      >
        <CountryFlag code={tz.countryCode} decorative className="h-3.5 w-[21px]" />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm leading-5", selected && "font-medium")}>{tz.city}</p>
          <p className="truncate text-[11px] leading-4 text-muted-foreground">{tz.country}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="flex items-center justify-end gap-1.5 text-xs leading-5 tabular-nums">
            <StatusDot good={status.good} className="size-1.5" />
            {time}
          </p>
          <p className="text-[10px] leading-4 text-muted-foreground">{abbr}</p>
        </div>
      </CommandItem>
    );
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              tooltip={tooltip}
              className="text-muted-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <span className="relative flex shrink-0">
                <CountryFlag code={timezone.countryCode} decorative className="h-3 w-[18px]" />
                {current && (
                  <StatusDot
                    good={current.status.good}
                    className="absolute -bottom-0.5 -right-0.5 size-2 ring-2 ring-sidebar"
                  />
                )}
              </span>
              <span className="truncate text-xs font-medium text-sidebar-foreground">{timezone.city}</span>
              <span className="ml-auto shrink-0 text-[11px] tabular-nums">
                {current ? `${current.time} ${current.abbr}` : "--:--"}
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
              {current && <span className="sr-only">{current.status.label}</span>}
            </SidebarMenuButton>
          </PopoverTrigger>

          <PopoverContent
            side={isCollapsed ? "right" : "top"}
            align={isCollapsed ? "end" : "start"}
            sideOffset={isCollapsed ? 12 : 8}
            collisionPadding={12}
            className="w-80 overflow-hidden rounded-xl p-0 shadow-xl bg-layout"
            onCloseAutoFocus={(event) => {
              // After a mouse pick, don't refocus the trigger (it would pop its tooltip).
              // Keyboard picks still return focus, as they should.
              if (pickedWithPointer.current) event.preventDefault();
              pickedWithPointer.current = false;
            }}
          >
            <Command loop defaultValue={timezone.id}>
              {/* Selected zone summary */}
              <div className="border-b px-3.5 py-3">
                <p className="text-[11px] font-medium text-muted-foreground">Working timezone</p>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold">
                      <CountryFlag code={timezone.countryCode} decorative />
                      {timezone.city}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {timezone.country}
                      {now && `, ${describeRelativeToLocal(timezone.timeZone, now)}`}
                    </p>
                  </div>
                  {current && (
                    <div className="shrink-0 text-right">
                      <p className="text-base font-semibold leading-6 tabular-nums">{current.time}</p>
                      <p className="text-[11px] text-muted-foreground">{current.abbr}</p>
                    </div>
                  )}
                </div>

                {current && (
                  <div
                    className={cn(
                      "mt-2.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium",
                      current.status.good
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    )}
                  >
                    <StatusDot good={current.status.good} className="size-1.5" />
                    {current.status.label}
                  </div>
                )}
              </div>

              <CommandInput placeholder="Search city or country" />

              <CommandList
                className="max-h-64 scrollbar-thin"
                onPointerDown={() => {
                  pickedWithPointer.current = true;
                }}
              >
                <CommandEmpty>No timezone found.</CommandEmpty>
                {callable.length > 0 && (
                  <CommandGroup heading="Good to call now">{callable.map(renderRow)}</CommandGroup>
                )}
                {outside.length > 0 && (
                  <CommandGroup heading="Outside calling hours">{outside.map(renderRow)}</CommandGroup>
                )}
              </CommandList>

              <div className="flex items-center gap-1.5 border-t px-3.5 py-2 text-[11px] text-muted-foreground">
                <Clock3 className="size-3 shrink-0" />
                Client calling hours {describeCallingHours()}
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
