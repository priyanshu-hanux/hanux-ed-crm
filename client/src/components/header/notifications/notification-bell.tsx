import * as React from "react";
import { addDays, isAfter, isToday } from "date-fns";
import { Bell, Check, CheckCheck, Settings2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NotificationItem } from "@/components/header/notifications/notification-item";
import { useNotifications } from "@/contexts/notification-provider";
import { isNotificationUnread, matchesTab, type Notification, type NotificationTab } from "@/types/notification-types";
import { appIcons } from "@/configs/icons";

const TABS: { value: NotificationTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mentions", label: "Mentions" },
  { value: "tasks", label: "Tasks" },
  { value: "deals", label: "Deals" },
  { value: "system", label: "System" },
];

const EMPTY_COPY: Record<NotificationTab, { title: string; body: string }> = {
  all: { title: "You're all caught up", body: "Mentions, tasks, deals and system updates from the last 7 days will show up here." },
  mentions: { title: "No mentions", body: "When a teammate mentions you, it will show up here." },
  tasks: { title: "No task updates", body: "Assignments and due-date reminders will show up here." },
  deals: { title: "No deal activity", body: "Stage changes and deal updates will show up here." },
  system: { title: "No system updates", body: "Billing, security and workspace notices will show up here." },
};

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<NotificationTab>("all");
  const { notifications, unreadCount, markRead, markUnread, markAllRead, archive, runAction } = useNotifications();

  // Recomputed when the popover opens, so the 7-day window stays current without re-filtering every render
  const cutoff = React.useMemo(() => addDays(new Date(), -7), [open]);

  const lastWeek = React.useMemo(
    () => notifications
      .filter((item) => !item.archivedAt && isAfter(new Date(item.createdAt), cutoff))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [notifications, cutoff],
  );

  const recent = React.useMemo(() => lastWeek.filter((item) => matchesTab(item, tab)), [lastWeek, tab]);

  const unreadByTab = React.useMemo(() => {
    const counts = {} as Record<NotificationTab, number>;
    for (const { value } of TABS) {
      counts[value] = lastWeek.filter((item) => matchesTab(item, value) && isNotificationUnread(item)).length;
    }
    return counts;
  }, [lastWeek]);

  const groups = React.useMemo(() => {
    const today: Notification[] = [];
    const earlier: Notification[] = [];
    for (const item of recent) (isToday(new Date(item.createdAt)) ? today : earlier).push(item);
    return [
      { label: "Today", items: today },
      { label: "Earlier", items: earlier },
    ].filter((group) => group.items.length);
  }, [recent]);

  const empty = EMPTY_COPY[tab];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="relative"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            >
              <appIcons.notification />
              {unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold tabular-nums text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Notifications</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        sideOffset={12}
        collisionPadding={12}
        className="flex w-100 max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium leading-5">Notifications</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Activity from the last 7 days</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", unreadCount ? "bg-red-400" : "bg-emerald-500")} />
              {unreadCount ? `${unreadCount} unread` : "All clear"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              aria-label="Mark all notifications as read"
              title="Mark all as read"
            >
              <CheckCheck className="size-4" />
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              aria-label="Notification settings"
              title="Notification settings"
            >
              <Link to="/settings/notifications" onClick={() => setOpen(false)}>
                <Settings2 className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Tabs value={tab} onValueChange={(value) => setTab(value as NotificationTab)} className="px-3 pb-3">
          <TabsList className="h-8 w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 scrollbar-none">
            {TABS.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  "h-7 flex-none gap-1.5 rounded-full border border-transparent px-3 text-xs font-medium text-muted-foreground shadow-none",
                  "transition-colors",
                  "hover:text-foreground",
                  "data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                )}
              >
                <span>{label}</span>
                {unreadByTab[value] ? (
                  <span className="text-xs font-semibold tabular-nums leading-4 text-destructive/70 data-[state=active]:text-primary">
                    {unreadByTab[value]}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Separator />

        {/* List — fixed height so switching tabs never makes the popover jump */}
        <div className="h-[min(55vh,440px)] overflow-y-auto overscroll-contain">
          {groups.length ? (
            <div className="px-2 pb-2">
              {groups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h3 className="sticky top-0 z-10 bg-popover/95 px-3 pb-1 pt-3 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                    {group.label}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        compact
                        onRead={markRead}
                        onUnread={markUnread}
                        onArchive={archive}
                        onAction={runAction}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <div className="relative mb-4 grid size-14 place-items-center rounded-2xl border bg-background shadow-sm">
                <Bell className="size-6 text-muted-foreground" />
                {tab === "all" ? (
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-popover">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-semibold">{empty.title}</p>
              <p className="mt-1 max-w-68 text-xs leading-5 text-muted-foreground">{empty.body}</p>
            </div>
          )}
        </div>

        {/* Footer stays pinned instead of scrolling away with the list */}
        {recent.length > 10 ? (
          <div className="border-t p-2">
            <Button asChild variant="ghost" className="h-9 w-full justify-between rounded-lg px-3 text-sm font-medium">
              <Link to={`/notifications?tab=${tab}&status=all&page=1`} onClick={() => setOpen(false)}>
                View all notifications
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {notifications.filter((item) => !item.archivedAt).length}
                </span>
              </Link>
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}